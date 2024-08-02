import { useState } from "react";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";
import { FaVoteYea } from "react-icons/fa"; // Voting icon from react-icons

export default function NavbarAdmin() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-blue-500 text-white h-16 flex items-center px-4 shadow-lg sticky top-0 z-50">
      <div className="flex items-center">
        <Link
          to="/"
          className="text-white-400 text-4xl mr-4 hover:text-blue-300 transition-colors duration-300"
        >
          <FaVoteYea />
        </Link>

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
            to: "/createProposal",
            icon: "fas fa-file-contract",
            text: "Create Proposal",
          },
          {
            to: "/approveShareholders",
            icon: "fas fa-user-check",
            text: "Approve Shareholders",
          },
          {
            to: "/editProposals",
            icon: "fas fa-user-edit",
            text: "Edit Proposals",
          },
          { to: "/allResults", icon: "fas fa-poll", text: "All Results" },
        ].map((item) => (
          <li key={item.to} className="lg:ml-6 flex-1 text-center">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-2 text-lg font-semibold rounded-md ${
                  isActive ? "bg-blue-900 text-white-400" : "text-white"
                } hover:bg-blue-900 hover:text-white-400 transition flex items-center justify-center`
              }
            >
              <i className={`${item.icon} mr-2`} />
              <span>{item.text}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
