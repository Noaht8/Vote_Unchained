import { useState } from "react";
import { NavLink } from "react-router-dom";
import { FaVoteYea, FaUserCheck, FaUserEdit, FaPoll } from "react-icons/fa"; // icons
import PropTypes from "prop-types";

function Navbar({ id }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-blue-500 text-white h-16 flex items-center px-4 shadow-lg sticky top-0 z-50">
      <div className="flex items-center">
        <FaVoteYea className="text-white text-4xl mr-4" />
        <button
          onClick={() => setOpen(!open)}
          className={`lg:hidden p-3 rounded-lg transition-colors duration-300 ${
            open ? "bg-blue-900 text-cyan-400" : "bg-blue-700 text-white"
          } hover:bg-blue-900`}
        >
          <i className="fas fa-bars fa-lg" />
        </button>
      </div>
      <ul
        className={`fixed top-16 left-0 w-full bg-blue-500 lg:bg-transparent lg:static lg:flex lg:space-x-8 transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {[
          {
            to: `/registerShareholder/${id}`,
            icon: <FaUserCheck />,
            text: "Shareholder Registration",
          },
          {
            to: `/ShareholderInformation/${id}`,
            icon: <FaUserEdit />,
            text: "Shareholder Profile",
          },
          { to: `/vote/${id}`, icon: <FaVoteYea />, text: "Vote" },
          { to: `/result/${id}`, icon: <FaPoll />, text: "Result" },
        ].map((item) => (
          <li key={item.to} className="lg:ml-6 flex-1 text-center">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-2 text-lg font-semibold rounded-md ${
                  isActive ? "bg-blue-900 text-white" : "text-white"
                } hover:bg-blue-900 hover:text-white transition flex items-center justify-center`
              }
            >
              <span className="text-2xl mr-2">{item.icon}</span>
              <span>{item.text}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

Navbar.propTypes = {
  id: PropTypes.string.isRequired,
};

export default Navbar;
