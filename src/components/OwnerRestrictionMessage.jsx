const OwnerRestrictionMessage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-red-100 border border-red-400 text-red-700 px-8 py-6 rounded-xl shadow-lg max-w-3xl w-full">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h1m-1 4h-1m-1-4h1V7a1 1 0 011-1h2a1 1 0 011 1v5h1v4h-1m-1 0h-2m0 0v3m-4-6v6m2 0v-6"
              />
            </svg>
          </div>
          <div className="ml-4">
            <strong className="text-2xl font-extrabold">Access Denied</strong>
            <p className="mt-2 text-lg">
              The account is not the owner of the contract. You cannot proceed;
              only the owner has the required permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerRestrictionMessage;
