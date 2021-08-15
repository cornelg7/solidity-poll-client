import * as React from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/Poll.json';

export default function App() {
  const [authGuard, setAuthGuard] = React.useState("");
  const [currentAccount, setCurrentAccount] = React.useState("");
  const [activeQuestion, setActiveQuestion] = React.useState("");
  const [totalNumberOfVotes, setTotalNumberOfVotes] = React.useState("");
  const [isLoading, setIsLoading] = React.useState("");
  const contractAddress = '0xaEB5242A029C63f7f331f8DaD53B1f48d8070094';
  const contractABI = abi.abi;

  const isWalletConnected = () => {
    return !!window?.ethereum;
  }

  const connectToAccount = () => {
    window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
      if (accounts.length > 0) {
        const account = accounts[0];
        setCurrentAccount(account);
      } else {
        setAuthGuard('No authorized account');
      }
    });
  }

  const connectWallet = () => {
    window.ethereum.request({ method: 'eth_requestAccounts' }).then(accounts => {
      setAuthGuard('Connected');
      setCurrentAccount(accounts[0]);
    }).catch(error => {
      console.error(error);
      setAuthGuard('No authorized account');
    });
  }

  React.useEffect(() => {
    if (isWalletConnected()) {
      connectToAccount();
    } else {
      setAuthGuard('No wallet');
    }
    if (!!currentAccount) {
      getActiveQuestion();
    }
  }, [currentAccount]);

  const getActiveQuestion = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const pollContract = new ethers.Contract(contractAddress, contractABI, signer);
    const question = await pollContract.getActiveQuestion();
    setActiveQuestion(question);
    updateTotalNumberOfVotes(question);
  }

  const updateTotalNumberOfVotes = (question) => {
    setTotalNumberOfVotes(Number(question.answers[0].votes) + Number(question.answers[1].votes));
  }

  const vote = async (option) => {
    if (isLoading) {
      return;
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const pollContract = new ethers.Contract(contractAddress, contractABI, signer);
    try {
      const voteTxn = await pollContract.vote(option);
      setIsLoading(true);
      await voteTxn.wait();
      const question = await pollContract.getActiveQuestion();
      setActiveQuestion(question);
      updateTotalNumberOfVotes(question);
      setIsLoading(false);
    } catch (error) {
    }
  }

  const renderVoteButtonsContainer = () => (
    <div className="vote-buttons-container">
      {
        activeQuestion.answers.map((answer, index) => (
          <div className="vote-item" key={`${index}-vote-item`}>
            <button className={`button ${isLoading ? "disabled" : ""}`} key={`${index}-button`} onClick={() => vote(index)}>
              {answer.text}
            </button>
            <span key={`${index}-votes`} className="votes">{Number(answer.votes)}</span>
            <span key={`${index}-percentages`} className="percentage">{(Number(answer.votes) / totalNumberOfVotes * 100).toFixed(1)}%</span>
          </div>
        ))
      }
    </div>
  )

  if (authGuard === 'No wallet') {
    return (
      <div className="mainContainer">
        <div className="dataContainer">
          <div className="header">
            🛑 No wallet connected!
          </div>
          <div className="bio">
            Create one <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">Here!</a>
          </div>
        </div>
      </div>
    );
  }

  if (authGuard === 'No authorized account') {
    return (
      <div className="mainContainer">
        <div className="dataContainer">
          <div className="header">
            🐛 Login below!
          </div>
          <button className="button" onClick={connectWallet}>
            Connect wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          {activeQuestion.text}
        </div>
        { !!activeQuestion?.answers ? renderVoteButtonsContainer() : null }
        { !!isLoading ? (
          <span className="loading-while-mining">
            <span className="wait">Mining</span>
            <span className="spinner"></span>
          </span>
        ) : null }
      </div>
    </div>
  );
}
