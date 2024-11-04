import { useState, useEffect } from "react";
import getWeb3 from "../../GetWeb3";
import ShareVoting from "../../contracts/ShareVoting.json";
import ConfirmationModal from "../ConfirmationModal";
import Footer from "../Footer";
import NavigationOwner from "./NavigationOwner";
import { create } from "ipfs-http-client";
import { Buffer } from "buffer";
import { ClipLoader } from "react-spinners";
import OwnerRestrictionMessage from "../OwnerRestrictionMessage";

const ipfs = create({ url: "http://127.0.0.1:5001" });

export default function EditProposals() {
  const [ElectionInstance, setElectionInstance] = useState(undefined);
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [isOwner, setIsOwner] = useState(null);

  const [proposals, setProposals] = useState([]);
  const [editingProposal, setEditingProposal] = useState(null);
  const [proposalName, setProposalName] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [proposerInformation, setProposerInformation] = useState("");
  const [proposalCategory, setProposalCategory] = useState("");
  const [contactInformation, setContactInformation] = useState("");
  const [files, setFiles] = useState([]); // State for storing the uploaded files
  const [deletedFileNames, setDeletedFileNames] = useState([]);
  const [editFiles, setEditFiles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [idDelete, setIdDelete] = useState("");
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

        const fetchProposals = async () => {
          try {
            const proposalIds = await instance.methods.getProposalIds().call();

            console.log("Ids = ", proposalIds);
            const proposals = await Promise.all(
              proposalIds.map(async (id) => {
                const proposal = await instance.methods.getProposal(id).call();
                return { id, ...proposal };
              })
            );
            await setProposals(proposals);
            console.log("Proposals = ", proposals);
          } catch (error) {
            console.error("Error fetching proposals:", error);
          }
        };

        await fetchProposals();
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

  const retrieveDataFromIpfs = async (ipfsHash) => {
    if (!ipfsHash) return;
    let data = "";
    for await (const chunk of ipfs.cat(ipfsHash)) {
      data += new TextDecoder().decode(chunk);
    }

    const parsedData = await JSON.parse(data);
    await setProposalName(parsedData.proposalName);
    await setProposalDescription(parsedData.proposalDescription);
    await setProposerInformation(parsedData.proposerInformation);
    await setEndDate(parsedData.endDate);
    await setProposalCategory(parsedData.proposalCategory);
    await setContactInformation(parsedData.contactInformation);
    console.log("parsedData: ", parsedData);

    // Clear editFiles state before adding new files
    const fileBlobs = [];
    for (const file of parsedData.files) {
      let fileData = [];
      for await (const chunk of ipfs.cat(file.path)) {
        fileData.push(chunk);
      }
      const blob = new Blob(fileData); // Create a Blob from IPFS chunks
      fileBlobs.push({ blob, name: file.name });
    }
    setEditFiles(fileBlobs);
  };

  const handleFileDelete = (fileName) => {
    setEditFiles(editFiles.filter((file) => file.name !== fileName));
    setDeletedFileNames((prev) => [...prev, fileName]);
  };

  const isImageFile = (fileName) => {
    return /\.(jpg|jpeg|png)$/i.test(fileName);
  };

  const handleEditClick = async (proposal) => {
    await setEditingProposal(proposal);
    await retrieveDataFromIpfs(proposal[6]);
  };

  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({ ...prev, [name]: value }));
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endTime = await Math.floor(new Date(endDate).getTime() / 1000);
      console.log("End Time:", endTime);
      console.log("editingProposal", editingProposal[0]);
      const updatedData = {
        proposalId: editingProposal[0],
        proposalName: proposalName,
        proposalDescription: proposalDescription,
        endDate: endDate,
        proposerInformation: proposerInformation,
        proposalCategory: proposalCategory,
        contactInformation: contactInformation,
        files: [],
        timestamp: new Date().toISOString(),
      };

      // Add new files to IPFS
      for (const file of files) {
        const added = await ipfs.add(file);
        await updatedData.files.push({ path: added.path, name: file.name });
      }

      // Include existing files that were not deleted
      for (const file of editFiles) {
        if (!deletedFileNames.includes(file.name)) {
          const added = await ipfs.add(file.blob);
          await updatedData.files.push({ path: added.path, name: file.name });
        }
      }
      const jsonData = await JSON.stringify(updatedData);
      const result = await ipfs.add(Buffer.from(jsonData));
      const newIpfsHash = await result.path;
      console.log("Data: ", updatedData);

      await ElectionInstance.methods
        .editProposal(
          editingProposal[0],
          updatedData.proposalName,
          updatedData.proposalDescription,
          endTime,
          newIpfsHash
        )
        .send({
          from: account,
          gas: 1000000,
          gasPrice: web3.utils.toWei("20", "gwei"),
        });

      setEditingProposal(null);
      setDeletedFileNames([]);
      setEditFiles([]);

      setProposalName("");
      setProposalDescription("");
      setProposerInformation("");
      setEndDate("");
      setProposalCategory("");
      setContactInformation("");
      // Reload the page
      await window.location.reload();

      const updatedProposalIds = await ElectionInstance.methods
        .getProposalIds()
        .call();
      const updatedProposals = await Promise.all(
        updatedProposalIds.map(async (id) => {
          const proposal = await ElectionInstance.methods
            .getProposal(id)
            .call();
          return { id, ...proposal };
        })
      );
      setProposals(updatedProposals);
    } catch (error) {
      console.error("Error submitting proposal edit:", error);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleDeleteClick = async (_proposalId) => {
    await setIdDelete(_proposalId);
    await openModal();
    console.log("ProposalId=", _proposalId); // Open the confirmation modal
  };

  const handleConfirmDelete = async () => {
    closeModal(); // Close the modal
    // Proceed with delete action
    const tx = await ElectionInstance.methods.deleteProposal(idDelete).send({
      from: account,
      gas: 1000000,
      gasPrice: web3.utils.toWei("20", "gwei"),
    });
    console.log("Transaction result:", tx);
    console.log(`Proposal ${idDelete} deleted`);
    setIdDelete("");
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
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          {editingProposal ? (
            <div className="max-w-4xl mx-auto p-4">
              <h1 className="text-2xl font-bold mb-4">Edit Proposal</h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={proposalName}
                    onChange={(e) => setProposalName(e.target.value)}
                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={proposalDescription}
                    onChange={(e) => setProposalDescription(e.target.value)}
                    className="mt-1 p-2 w-full border border-gray-300 rounded-md"
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
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium mb-1"
                  >
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
                    <option value="Legal and Regulatory">
                      Legal and Regulatory
                    </option>
                    <option value="Technology and Innovation">
                      Technology and Innovation
                    </option>
                    <option value="Marketing and Sales">
                      Marketing and Sales
                    </option>
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

                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files))}
                  className="mb-4 p-2 w-full"
                />
                {editFiles.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xl font-bold mb-2">Current Files:</h3>
                    {editFiles.map((file, index) => (
                      <div key={index} className="mb-4">
                        {isImageFile(file.name) ? (
                          <img
                            src={URL.createObjectURL(file.blob)}
                            alt={`Edit ${file.name}`}
                            className="max-w-full h-auto mb-2"
                          />
                        ) : (
                          <a
                            href={URL.createObjectURL(file.blob)}
                            download={file.name}
                            className="text-blue-500 hover:underline"
                          >
                            {file.name}
                          </a>
                        )}
                        <button
                          onClick={() => handleFileDelete(file.name)}
                          className="bg-red-500 text-white py-1 px-2 rounded ml-4"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 text-white rounded-md"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProposal(null)}
                    className="px-4 py-2 bg-red-500 text-white rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="max-w-8xl mx-auto p-4">
              <div
                className={
                  proposals.length > 0
                    ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                    : ""
                }
              >
                {proposals.length === 0 && (
                  <div className="flex items-center justify-center min-h-screen bg-gray-100 w-full">
                    <div className="text-center">
                      <h1 className="text-4xl font-extrabold text-blue-600 mb-4">
                        No Proposals Added Yet
                      </h1>
                      <p className="text-lg text-gray-600">
                        It looks like there are no proposals currently
                        available. Please check back later or add a new
                        proposal.
                      </p>
                    </div>
                  </div>
                )}

                {proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="border border-gray-300 rounded-md p-4"
                  >
                    <h3 className="text-lg font-bold mb-2">
                      ID: {proposal[0]}
                    </h3>
                    <h3 className="text-lg font-bold mb-2">
                      Name: {proposal[1]}
                    </h3>
                    <p className="text-gray-700 mb-2">
                      Description: {proposal[2]}
                    </p>
                    <p className="text-gray-700 mb-2">
                      IpfsHash: {proposal[6]}
                    </p>
                    <a
                      href={`${window.location.origin}/vote/${proposal.id}`}
                      className="text-blue-500 underline block mb-2"
                    >
                      {`${window.location.origin}/vote/${proposal.id}`}
                    </a>
                    <div className="flex space-x-8">
                      <button
                        onClick={() => handleEditClick(proposal)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(proposal[0])}
                        className="px-4 py-2 bg-red-500 text-white rounded-md"
                      >
                        Delete
                      </button>
                      <ConfirmationModal
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        message="Are You Sure"
                        onConfirm={() => handleConfirmDelete()}
                      />
                    </div>
                    {/* Confirmation Modal */}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
}
