import PropTypes from "prop-types";

const Notification = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white p-6 rounded-lg shadow-lg max-w-md w-full">
      <p className="text-lg font-semibold">{message}</p>
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-white hover:text-gray-200 text-2xl"
      >
        &times;
      </button>
    </div>
  );
};

Notification.propTypes = {
  message: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};

export default Notification;
