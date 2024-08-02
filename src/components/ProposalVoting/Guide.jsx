import PropTypes from "prop-types";

const Guide = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-4">How to Create a Proposal</h2>
        <p className="mb-4">
          Welcome to the Shareholder Proposal Voting platform! Follow the steps
          below to create a proposal:
        </p>
        <ul className="list-disc list-inside mb-4">
          <li>
            Enter the <strong>Proposal Name</strong> and{" "}
            <strong>Description</strong>.
          </li>
          <li>
            Provide your <strong>Information</strong> and set the{" "}
            <strong>End Date</strong> for the vote.
          </li>
          <li>
            Select the <strong>Proposal Category</strong> from the dropdown.
          </li>
          <li>
            Enter your <strong>Contact Information</strong> for any inquiries.
          </li>
          <li>Upload any relevant documents that support your proposal.</li>
          <li>
            Click <strong>Create Proposal</strong> to submit your proposal.
          </li>
        </ul>
        <button
          onClick={onClose}
          className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
        >
          Got It
        </button>
      </div>
    </div>
  );
};

Guide.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default Guide;
