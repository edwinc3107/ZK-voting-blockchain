import React, { useState } from 'react';

const DemoWorkflowGuide = ({ isVisible, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const workflowSteps = [
    {
      title: "1. Board Member Posts Case",
      description: "A board member creates a new ethics case that needs community voting",
      action: "Go to Board Interface → Create New Ethics Case",
      icon: "📋"
    },
    {
      title: "2. Case Goes Live",
      description: "The case becomes active and visible to all verified voters",
      action: "Case appears in Voting Interface automatically",
      icon: "🟢"
    },
    {
      title: "3. Verified Voters Cast Votes",
      description: "Doctors, nurses, and staff vote using their verified wallets",
      action: "Switch to voter role → Vote YES/NO on active cases",
      icon: "🗳️"
    },
    {
      title: "4. Board Resolves Case",
      description: "After voting deadline, board members resolve the case based on results",
      action: "Switch back to board member → Resolve Case",
      icon: "✅"
    },
    {
      title: "5. Results Recorded",
      description: "Final decision is recorded on blockchain with full transparency",
      action: "View results in Results page",
      icon: "📊"
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            🎭 Demo Workflow Guide
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Follow this workflow to demonstrate the complete hospital ethics voting system:
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">💡 Demo Tips:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use the Demo Mode button to switch between different roles</li>
                <li>• Watch the transaction recorder for real-time blockchain events</li>
                <li>• Each step involves actual smart contract interactions</li>
                <li>• All votes are private but verifiable through ZK proofs</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            {workflowSteps.map((step, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition-all ${
                  currentStep === index
                    ? 'border-medical-500 bg-medical-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{step.icon}</div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      currentStep === index ? 'text-medical-900' : 'text-gray-900'
                    }`}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {step.description}
                    </p>
                    <div className={`text-xs mt-2 px-2 py-1 rounded ${
                      currentStep === index 
                        ? 'bg-medical-100 text-medical-800' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      <strong>Action:</strong> {step.action}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-2">
              {workflowSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full ${
                    currentStep === index ? 'bg-medical-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            
            <button
              onClick={() => setCurrentStep(Math.min(workflowSteps.length - 1, currentStep + 1))}
              disabled={currentStep === workflowSteps.length - 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Start Demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoWorkflowGuide;
