import { ethers } from 'ethers';


export const saveReceipt = (receiptHash, caseId, voterAddress) => {
  try {
    const receipts = JSON.parse(localStorage.getItem('voteReceipts') || '[]');
    
    const receiptData = {
      receiptHash,
      caseId,
      voterAddress,
      savedAt: new Date().toISOString()
    };
    
    receipts.push(receiptData);
    localStorage.setItem('voteReceipts', JSON.stringify(receipts));
    
    return true;
  } catch (error) {
    console.error('Error saving receipt:', error);
    return false;
  }
};


export const getSavedReceipts = () => {
  try {
    return JSON.parse(localStorage.getItem('voteReceipts') || '[]');
  } catch (error) {
    console.error('Error loading receipts:', error);
    return [];
  }
};


export const getReceiptsForCase = (caseId) => {
  const receipts = getSavedReceipts();
  return receipts.filter(r => r.caseId === caseId);
};


export const formatReceiptHash = (receiptHash, startLength = 6, endLength = 4) => {
  if (!receiptHash || receiptHash.length < startLength + endLength) {
    return receiptHash;
  }
  return `${receiptHash.slice(0, startLength)}...${receiptHash.slice(-endLength)}`;
};


export const verifyReceiptOnChain = async (contract, receiptHash, caseId) => {
  try {
    if (!contract || !receiptHash || caseId === null) {
      return false;
    }
    
    const isValid = await contract.verifyReceipt(receiptHash, caseId);
    return isValid;
  } catch (error) {
    console.error('Error verifying receipt on-chain:', error);
    return false;
  }
};


export const getVoterReceipt = async (contract, voterAddress, caseId) => {
  try {
    if (!contract || !voterAddress || caseId === null) {
      return '';
    }
    
    const receiptHash = await contract.getVoterReceipt(voterAddress, caseId);
    return receiptHash;
  } catch (error) {
    console.error('Error getting voter receipt:', error);
    return '';
  }
};


export const getCaseReceiptsFromChain = async (contract, caseId) => {
  try {
    if (!contract || caseId === null) {
      return [];
    }
    
    const receipts = await contract.getCaseReceipts(caseId);
    return receipts;
  } catch (error) {
    console.error('Error getting case receipts:', error);
    return [];
  }
};

