import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaShieldAlt,
  FaExpand,
  FaUserCog,
  FaHandshake,
  FaBrain,
} from "react-icons/fa";
import Notification from "./Notification";
import Footer from "./Footer";
import { ClipLoader } from "react-spinners";

const HomePage = () => {
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state

  const handleFeatureClick = (e) => {
    e.preventDefault();
    setMessage("Feature coming soon!");
    setTimeout(() => setMessage(null), 3000); // Hide message after 3 seconds
  };

  const votingScenarios = [
    {
      title: "National Elections",
      items: [
        "Presidential elections",
        "Parliamentary or legislative elections",
      ],
    },
    {
      title: "Local Elections",
      items: [
        "Mayoral elections",
        "City council elections",
        "County or district elections",
      ],
    },
    {
      title: "Shareholder Voting",
      items: [
        { text: "Proposal Voting", link: "/createProposal" },
        "Corporate governance decisions",
        "Board of directors elections",
        "Approval of mergers and acquisitions",
        "Approval of Financial Statements",
      ],
    },
    {
      title: "Referendums and Ballot Initiatives",
      items: [
        "National referendums on policy issues",
        "Local ballot initiatives and propositions",
      ],
    },
    {
      title: "Organizational Voting",
      items: [
        "University or academic institution elections",
        "Professional association elections",
      ],
    },
    {
      title: "Community and Civic Voting",
      items: [
        "Homeowners' association (HOA) elections",
        "Community board or council elections",
      ],
    },
    {
      title: "Political Party Elections",
      items: ["Primary elections", "Party leadership elections"],
    },
    {
      title: "Union Elections",
      items: ["Union leadership elections", "Contract ratification votes"],
    },
    {
      title: "Cooperative Voting",
      items: [
        "Cooperative board elections",
        "Decision-making on cooperative initiatives",
      ],
    },
    {
      title: "Nonprofit Organization Voting",
      items: ["Board member elections", "Policy or strategic decision voting"],
    },
  ];

  useEffect(() => {
    // Simulate a loading period
    setTimeout(() => {
      setLoading(false);
    }, 2000); // Adjust the timeout as needed
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="mb-4">
            <ClipLoader color="#4A90E2" size={50} />
          </div>
          <h1 className="text-3xl font-semibold text-gray-800">
            Blockchain Voting System
          </h1>
          <p className="mt-2 text-lg text-gray-600">Loading, please wait...</p>
        </div>
      </div>
    );

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10">
        {/* Welcome Section */}
        <section className="relative bg-gradient-to-r from-blue-600 to-teal-500 text-white w-full py-24 flex flex-col items-center text-center rounded-lg shadow-xl overflow-hidden transition-transform duration-500 transform hover:scale-105">
          <h1 className="text-4xl font-bold mb-4 leading-tight transition-all duration-500 hover:text-teal-200">
            Welcome to the Blockchain Voting System
          </h1>
          <p className="text-lg max-w-2xl mb-6 leading-relaxed transition-all duration-500 hover:text-teal-100">
            Transforming voting with secure, transparent blockchain technology.
          </p>
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            {[
              { icon: FaShieldAlt, label: "Security & Transparency" },
              { icon: FaBrain, label: "Innovative Technology" },
              { icon: FaExpand, label: "Scalability" },
              { icon: FaUserCog, label: "User-Centric Design" },
            ].map(({ icon: Icon, label }, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white text-blue-700 p-5 rounded-lg shadow-md transition-transform duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <Icon className="text-3xl transition-transform duration-300 transform hover:scale-110" />
                <p className="text-xl font-medium">{label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white text-gray-800 p-8 rounded-lg shadow-xl mx-4 md:mx-8 max-w-full">
            <h2 className="text-2xl font-semibold mb-6 transition-all duration-300 hover:text-blue-700">
              Our Commitments
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: FaShieldAlt,
                  title: "Integrity",
                  description:
                    "We uphold the highest standards of integrity in our voting processes to ensure trust and accountability.",
                },
                {
                  icon: FaHandshake,
                  title: "Accessibility",
                  description:
                    "Our system is designed to be accessible to all, ensuring that every voice can be heard and counted.",
                },
                {
                  icon: FaBrain,
                  title: "Innovation",
                  description:
                    "We continuously innovate to bring the latest advancements in technology to our voting system.",
                },
                {
                  icon: FaExpand,
                  title: "Scalability",
                  description:
                    "Our platform is designed to scale efficiently, accommodating increasing numbers of users and transactions.",
                },
                {
                  icon: FaUserCog,
                  title: "User-Centric Design",
                  description:
                    "We prioritize user experience and design our system to be intuitive and easy to navigate.",
                },
              ].map(({ icon: Icon, title, description }, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 bg-blue-50 p-6 rounded-lg shadow-md transition-transform duration-300 hover:scale-105 hover:shadow-lg"
                >
                  <Icon className="text-blue-600 text-3xl transition-transform duration-300 transform hover:scale-110" />
                  <div>
                    <h3 className="text-xl font-semibold text-blue-600">
                      {title}
                    </h3>
                    <p className="text-gray-700 mt-2">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Voting Scenarios Section */}
        <section className="bg-white shadow-lg rounded-lg w-full max-w-7xl p-8 mt-10 mx-4 md:mx-8">
          <h2 className="text-3xl font-semibold mb-6">Voting Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {votingScenarios.map((scenario, index) => (
              <div
                key={index}
                className="bg-blue-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 hover:scale-105"
              >
                <h3 className="text-2xl font-medium mb-4">{scenario.title}</h3>
                <ul className="list-disc pl-5 space-y-2">
                  {scenario.items.map((item, idx) =>
                    typeof item === "string" ? (
                      <li key={idx}>
                        <a
                          href="#"
                          className="text-blue-600 hover:underline"
                          onClick={handleFeatureClick}
                        >
                          {item}
                        </a>
                      </li>
                    ) : (
                      <li key={idx}>
                        <Link
                          to={item.link}
                          className="text-blue-600 hover:underline"
                        >
                          {item.text}
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Membership Section */}
        <section className="bg-blue-900 text-white w-full py-12 px-4 md:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Become a Member</h2>
            <p className="text-lg mb-6">
              Join our community and be part of the revolution in secure and
              transparent voting. Enjoy exclusive benefits and stay updated with
              our latest advancements.
            </p>
            <Link
              to="#"
              className="bg-yellow-500 text-blue-900 px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:bg-yellow-400"
              onClick={handleFeatureClick}
            >
              Learn More
            </Link>
          </div>
        </section>

        {/* Notification Component */}
        <Notification message={message} onClose={() => setMessage(null)} />
      </div>
      <Footer />
    </>
  );
};

export default HomePage;
