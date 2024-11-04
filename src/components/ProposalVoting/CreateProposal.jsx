import { useState, useEffect } from "react";
import getWeb3 from "../../GetWeb3";
import ShareVoting from "../../contracts/ShareVoting.json";
import Footer from "../Footer";
import NavigationOwner from "./NavigationOwner";
import Guide from "./Guide";
//import { Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { create } from "ipfs-http-client";
import { Buffer } from "buffer";
import { ClipLoader } from "react-spinners";
import OwnerRestrictionMessage from "../OwnerRestrictionMessage";

const ipfs = create({ url: "http://127.0.0.1:5001" });

const CreateProposal = () => {
  const [ElectionInstance, setElectionInstance] = useState(undefined);
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [isOwner, setIsOwner] = useState(null);
  const [proposalName, setProposalName] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [proposerInformation, setProposerInformation] = useState("");
  const [proposalLink, setProposalLink] = useState("");
  const [proposalCategory, setProposalCategory] = useState("");
  const [contactInformation, setContactInformation] = useState("");
  //const [ipfsHash, setIpfsHash] = useState("");
  const [proposalId, setProposalId] = useState(generateUniqueId());
  const [files, setFiles] = useState([]); // State for storing the uploaded files
  const [showGuide, setShowGuide] = useState(true); // State to control guide visibility
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!window.location.hash) {
        window.location = window.location + "#loaded";
        window.location.reload();
      }
      try {
        const web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = ShareVoting.networks[networkId];
        const instance = new web3.eth.Contract(
          ShareVoting.abi,
          deployedNetwork && deployedNetwork.address
        );

        setWeb3(web3);
        setElectionInstance(instance);
        setAccount(accounts[0]);

        const owner = await instance.methods.getOwner().call();
        if (accounts[0] === owner) {
          setIsOwner(true);
          console.log("The Owner");
        }

        // Check local storage for guide visibility
        const guideShown = localStorage.getItem("guideShown");
        if (guideShown) {
          setShowGuide(false);
        }
        setLoading(false);
      } catch (error) {
        alert(
          `Failed to load web3, accounts, or contract. Check console for details (f12).`
        );
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    // Set local storage to indicate that the guide has been shown
    if (!showGuide) {
      localStorage.setItem("guideShown", "true");
    }
  }, [showGuide]);

  function generateUniqueId() {
    return uuidv4();
  }

  const generateNewId = () => {
    console.log("Generating New ID");
    const newId = generateUniqueId();
    setProposalId(newId);
  };

  const handleCreateProposal = async (data, ipfsHash) => {
    try {
      console.log("Starting...");
      const endTime = Math.floor(new Date(data.endDate).getTime() / 1000); // converting endDate to Unix timestamp
      console.log("End Time:", endTime);
      console.log("The Hash:", ipfsHash);
      const tx = await ElectionInstance.methods
        .createProposal(
          data.proposalId,
          data.proposalName,
          data.proposalDescription,
          ipfsHash,
          endTime
        )
        .send({
          from: account,
          gas: 1000000,
          gasPrice: web3.utils.toWei("20", "gwei"),
        });
      console.log("Transaction result:", tx);
      setProposalLink(`${window.location.origin}/vote/${data.proposalId}`);
      alert("Proposal created successfully!");
    } catch (error) {
      console.error("Transaction error:", error);
    }
  };

  const createProposal = async (e) => {
    e.preventDefault();
    //await setIpfsHash(""); // Clear the previous hash
    console.log("Starting Create Proposal");
    await generateNewId();
    const data = {
      proposalId,
      proposalName,
      proposalDescription,
      endDate,
      proposerInformation,
      proposalCategory,
      contactInformation,
      files: [],
      timestamp: new Date().toISOString(),
    };
    //console.log("Data = ", data);

    // Add files to IPFS
    for (const file of files) {
      const added = await ipfs.add(file);
      data.files.push({ path: added.path, name: file.name });
    }

    // Add the combined data to IPFS
    const jsonData = JSON.stringify(data);
    const result = await ipfs.add(Buffer.from(jsonData));

    // Directly use the IPFS hash from result
    const ipfsHash = result.path;

    console.log("Proposal ID:", proposalId);
    console.log("Proposal Name:", proposalName);
    console.log("Proposal Description:", proposalDescription);
    console.log("IPFS Hash:", ipfsHash);
    console.log("Files:", files);

    // Pass data with the IPFS hash to handleCreateProposal
    handleCreateProposal(data, ipfsHash);
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <ClipLoader color="#4A90E2" size={50} />
        <p className="mt-4 text-lg font-semibold text-gray-700">Loading...</p>
      </div>
    );

  if (!isOwner) {
    return <OwnerRestrictionMessage />;
  }

  return (
    <>
      <NavigationOwner />

      <div className="container mx-auto px-4 py-8">
        <div className="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
          <center>
            <h1 className="text-4xl font-extrabold text-blue-600 mb-4">
              Shareholder Proposal Voting
            </h1>
            {account && (
              <p className="text-xl text-gray-700">
                Connected account:{" "}
                <span className="font-medium text-blue-500">{account}</span>
              </p>
            )}
          </center>
        </div>

        <form
          onSubmit={createProposal}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h2 className="text-2xl font-bold mb-4">Create Proposal</h2>

          <div className="mb-4">
            <label
              htmlFor="proposalName"
              className="block text-sm font-medium mb-1"
            >
              Proposal Name:
            </label>
            <input
              type="text"
              name="proposalName"
              placeholder="Proposal Name"
              value={proposalName}
              onChange={(e) => setProposalName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="proposalDescription"
              className="block text-sm font-medium mb-1"
            >
              Proposal Description:
            </label>
            <textarea
              name="proposalDescription"
              placeholder="Proposal Description"
              value={proposalDescription}
              onChange={(e) => setProposalDescription(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md p-2 h-32 resize-none"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="proposerInformation"
              className="block text-sm font-medium mb-1"
            >
              {`Proposer's Information:`}
            </label>
            <input
              type="text"
              name="proposerInformation"
              placeholder="Name and Title"
              value={proposerInformation}
              onChange={(e) => setProposerInformation(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="endDate" className="block text-sm font-medium mb-1">
              End Date of the Proposal Vote:
            </label>
            <input
              type="date"
              name="endDate"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="proposalCategory"
              className="block text-sm font-medium mb-1"
            >
              Proposal Category Options:
            </label>
            <select
              name="proposalCategory"
              value={proposalCategory}
              onChange={(e) => setProposalCategory(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="" disabled>
                Select an option
              </option>
              <option value="Financial">Financial</option>
              <option value="Operational">Operational</option>
              <option value="Governance">Governance</option>
              <option value="Corporate Social Responsibility">
                Corporate Social Responsibility (CSR)
              </option>
              <option value="Human Resources">Human Resources</option>
              <option value="Legal and Regulatory">Legal and Regulatory</option>
              <option value="Technology and Innovation">
                Technology and Innovation
              </option>
              <option value="Marketing and Sales">Marketing and Sales</option>
              <option value="Risk Management">Risk Management</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="mb-4">
            <label
              htmlFor="contactInformation"
              className="block text-sm font-medium mb-1"
            >
              Contact Information for Inquiries:
            </label>
            <input
              type="text"
              name="contactInformation"
              placeholder="Email or Phone Number"
              value={contactInformation}
              onChange={(e) => setContactInformation(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="contactInformation"
              className="block text-sm font-medium mb-1"
            >
              Upload any relevant documents to support the proposal
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files))} // Capture files on change
              className="mb-4 p-2 w-full"
            />
          </div>

          <button
            type="submit"
            className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition"
          >
            Create Proposal
          </button>
        </form>

        {proposalLink && (
          <div className="mt-6 p-4 border border-gray-300 rounded-md bg-white shadow-sm">
            <h3 className="text-xl font-semibold mb-2">Proposal Link:</h3>
            <p>
              <a
                href={proposalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                {proposalLink}
              </a>
            </p>
          </div>
        )}

        {/* <button
          onClick={RetrieveAllProposals}
          className="mt-6 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition"
        >
          Retrieve Proposal
        </button> */}
      </div>

      {showGuide && <Guide onClose={() => setShowGuide(false)} />}

      <Footer />
    </>
  );
};

export default CreateProposal;
