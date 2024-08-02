//import React from "react";

const Footer = () => (
  <footer className="bg-blue-500 text-white py-4 flex items-center justify-center shadow-inner">
    <div className="flex items-center space-x-4">
      <i className="fab fa-ethereum text-2xl" />
      <p className="text-lg font-semibold">
        Blockchain Voting System &copy; {new Date().getFullYear()}. All rights
        reserved.
      </p>
    </div>
  </footer>
);

export default Footer;
