import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import getWeb3 from "../../GetWeb3";
import ShareVoting from "../../contracts/ShareVoting.json";
import Footer from "../Footer";
import NavigationVoter from "./NavigationVoter";
import ConfirmationModal from "../ConfirmationModal";
import { create } from "ipfs-http-client";
import { Buffer } from "buffer";
import { ClipLoader } from "react-spinners";

const ipfs = create({ url: "http://127.0.0.1:5001" });

export default function ShareholderInformation() {
  const { id } = useParams();
  const [ElectionInstance, setElectionInstance] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);

  const [isRegistered, setIsRegistered] = useState(null);
  const [editingShareholder, setEditingShareholder] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    shares: "",
    contactInfo: "",
    dob: "",
    nationality: "",
    signature: "",
  });

  const [image, setImage] = useState([]);
  const [proofOfIdentity, setProofOfIdentity] = useState([]);
  const [deletedFileNames, setDeletedFileNames] = useState([]);
  const [editFiles, setEditFiles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
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

        const registered = await instance.methods
          .isRegisteredShareholder(accounts[0])
          .call();

        await setIsRegistered(registered);
        console.log("Registered = ", registered);

        const fetchShareholder = async () => {
          try {
            const shareholder = await instance.methods
              .getShareholder(accounts[0])
              .call();
            let data = "";
            for await (const chunk of ipfs.cat(shareholder[5])) {
              data += new TextDecoder().decode(chunk);
            }
            const parsedData = JSON.parse(data);
            console.log(parsedData.name);
            setFormData({
              name: parsedData.name,
              shares: parsedData.shares,
              contactInfo: parsedData.contactInfo,
              dob: parsedData.dob,
              nationality: parsedData.nationality,
              signature: parsedData.signature,
            });

            // Retrieve the Image from IPFS
            const fileImage = [];
            for (const file of parsedData.image) {
              let fileData = [];
              for await (const chunk of ipfs.cat(file.path)) {
                fileData.push(chunk);
              }
              const blob = new Blob(fileData); // Create a Blob from IPFS chunks
              fileImage.push({ blob, name: file.name });
            }
            setImage(fileImage);

            // Retrieve the proofOfIdentity from IPFS
            const filePOI = [];
            for (const file of parsedData.proofOfIdentity) {
              let fileData = [];
              for await (const chunk of ipfs.cat(file.path)) {
                fileData.push(chunk);
              }
              const blob = new Blob(fileData); // Create a Blob from IPFS chunks
              filePOI.push({ blob, name: file.name });
            }
            setEditFiles(filePOI);
          } catch (error) {
            console.error("Error fetching shareholder:", error);
          }
        };
        if (registered) {
          fetchShareholder();
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
  }, [id]);

  const isImageFile = (fileName) => {
    return /\.(jpg|jpeg|png)$/i.test(fileName);
  };

  const handleFileDelete = (fileName) => {
    setEditFiles(editFiles.filter((file) => file.name !== fileName));
    setDeletedFileNames((prev) => [...prev, fileName]);
  };

  const handleEditClick = async () => {
    setEditingShareholder(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const validationErrors = validateForm();
      if (Object.keys(validationErrors).length === 0) {
        console.log("Editing Shareholder", account);
        const updatedData = {
          name: formData.name,
          shares: formData.shares,
          contactInfo: formData.contactInfo,
          dob: formData.dob,
          nationality: formData.nationality,
          image: [],
          proofOfIdentity: [],
          signature: formData.signature,
          timestamp: new Date().toISOString(),
        };
        console.log("Data: ", updatedData);
        // Add image to IPFS
        for (const file of image) {
          const added = await ipfs.add(file.blob);
          updatedData.image.push({ path: added.path, name: file.name });
        }

        // Add new files to IPFS
        for (const file of proofOfIdentity) {
          const added = await ipfs.add(file);
          updatedData.proofOfIdentity.push({
            path: added.path,
            name: file.name,
          });
        }

        // Include existing files that were not deleted
        for (const file of editFiles) {
          if (!deletedFileNames.includes(file.name)) {
            const added = await ipfs.add(file.blob);
            updatedData.proofOfIdentity.push({
              path: added.path,
              name: file.name,
            });
          }
        }
        const jsonData = await JSON.stringify(updatedData);
        const result = await ipfs.add(Buffer.from(jsonData));
        const newIpfsHash = await result.path;
        console.log("Data: ", updatedData);
        console.log("ipfsHash = ", newIpfsHash);
        console.log("Account = ", account);
        //const accounts = await web3.eth.getAccounts();
        const tx = await ElectionInstance.methods
          .editShareholder(
            account,
            updatedData.name,
            updatedData.shares,
            newIpfsHash
          )
          .send({
            from: account,
            gas: 1000000,
            gasPrice: web3.utils.toWei("20", "gwei"),
          });
        console.log("Transaction result:", tx);
        setSuccess(true);
        alert("Shareholder Edit successfull!");

        setEditingShareholder(false);
        setDeletedFileNames([]);
        setEditFiles([]);
        setProofOfIdentity([]);

        setFormData({
          name: "",
          shares: "",
          contactInfo: "",
          dob: "",
          nationality: "",
          signature: "",
        });
      } else {
        setErrors(validationErrors);
      }
    } catch (error) {
      console.error("Error submitting proposal edit:", error);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleDeleteClick = async () => {
    openModal();
  };

  const handleConfirmDelete = async () => {
    closeModal();
    // Proceed with delete action
    const tx = await ElectionInstance.methods.removeShareholder(account).send({
      from: account,
      gas: 1000000,
      gasPrice: web3.utils.toWei("20", "gwei"),
    });
    console.log("Transaction result:", tx);
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "file" ? files[0] : value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.shares) newErrors.shares = "Shares are required";
    if (!formData.contactInfo)
      newErrors.contactInfo = "Contact information is required";
    if (!formData.dob) newErrors.dob = "Date of birth is required";
    if (!formData.nationality)
      newErrors.nationality = "Nationality or country of residence is required";
    if (!formData.signature) newErrors.signature = "Signature is required";
    return newErrors;
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <ClipLoader color="#4A90E2" size={50} />
        <p className="mt-4 text-lg font-semibold text-gray-700">Loading...</p>
      </div>
    );

  return (
    <>
      <NavigationVoter id={id} />
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          {editingShareholder ? (
            <>
              <div className="container mx-auto px-4 py-8">
                <div className="p-6 bg-white shadow-lg rounded-lg max-w-2xl mx-auto">
                  <center>
                    <h1 className="text-4xl font-extrabold text-blue-600 mb-4">
                      Shareholder Registration
                    </h1>
                    {account && (
                      <p className="text-xl text-gray-700">
                        Connected account:{" "}
                        <span className="font-medium text-blue-500">
                          {account}
                        </span>
                      </p>
                    )}
                  </center>
                </div>
              </div>

              <div className="max-w-xl mx-auto p-4 border rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">
                  Shareholder Editing Form
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="shares"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Shares
                    </label>
                    <input
                      type="number"
                      id="shares"
                      name="shares"
                      value={formData.shares}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    />
                    {errors.shares && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.shares}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="contactInfo"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Contact Information
                    </label>
                    <input
                      type="text"
                      id="contactInfo"
                      name="contactInfo"
                      value={formData.contactInfo}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    />
                    {errors.contactInfo && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.contactInfo}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="dob"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="dob"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    />
                    {errors.dob && (
                      <p className="text-red-500 text-xs mt-1">{errors.dob}</p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="nationality"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Nationality / Country of Residence
                    </label>
                    <input
                      type="text"
                      id="nationality"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    />
                    {errors.nationality && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.nationality}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="signature"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Signature
                    </label>
                    <input
                      type="text"
                      id="signature"
                      name="signature"
                      value={formData.signature}
                      onChange={handleChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    />
                    {errors.signature && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.signature}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="image"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Shareholder Image
                    </label>
                    <input
                      type="file"
                      id="image"
                      name="image"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        // Replace existing image with the new one
                        setImage([{ blob: file }]);
                      }}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    />
                    {image.length > 0 && (
                      <img
                        src={URL.createObjectURL(image[0].blob)}
                        alt="Shareholder Image"
                        className="max-w-full h-auto mb-2"
                      />
                    )}
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="proofOfIdentity"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Proof of Identity
                    </label>
                    <input
                      type="file"
                      multiple
                      id="proofOfIdentity"
                      name="proofOfIdentity"
                      // accept="application/pdf, image/*"

                      onChange={(e) => {
                        setProofOfIdentity(Array.from(e.target.files));
                      }}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    />
                  </div>

                  <div className="mb-4">
                    {editFiles.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-xl font-bold mb-2">
                          Proof of Identity Current Files:
                        </h3>
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
                  </div>
                  <br />
                  <hr className="border-t-2 border-gray-300" />
                  <br />
                  <center>
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-4 py-2 rounded-md mr-6"
                    >
                      Submit
                    </button>
                    {success ? (
                      <p className="text-green-500 text-sm">
                        You have successfully submitted the form
                      </p>
                    ) : (
                      <p className="text-red-500 text-sm">
                        Error submitting the form data
                      </p>
                    )}
                    <button
                      type="submit"
                      className="bg-red-500 text-white px-4 py-2 rounded-md"
                      onClick={() => setEditingShareholder(false)}
                    >
                      Cancel
                    </button>
                  </center>
                </form>
              </div>
            </>
          ) : isRegistered ? (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
              <div className="bg-white shadow-lg rounded-lg p-6 max-w-2xl w-full mx-4">
                <h1 className="text-3xl font-extrabold text-blue-600 mb-4 text-center">
                  Shareholder Information
                </h1>
                {account && (
                  <p className="text-lg text-gray-700 mb-4 text-center">
                    Connected account:{" "}
                    <span className="font-medium text-blue-500">{account}</span>
                  </p>
                )}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Shareholder Details
                  </h2>
                  <div className="bg-gray-100 p-4 rounded-lg shadow-sm mb-4">
                    <p className="text-gray-700 mb-2">
                      <strong className="text-blue-600">Name:</strong>{" "}
                      {formData.name}
                    </p>
                    <p className="text-gray-700 mb-2">
                      <strong className="text-blue-600">Shares (%):</strong>{" "}
                      {formData.shares}
                    </p>
                    <p className="text-gray-700 mb-2">
                      <strong className="text-blue-600">
                        Contact Information:
                      </strong>{" "}
                      {formData.contactInfo}
                    </p>
                    <p className="text-gray-700 mb-2">
                      <strong className="text-blue-600">Date of Birth:</strong>{" "}
                      {formData.dob}
                    </p>
                    <p className="text-gray-700 mb-2">
                      <strong className="text-blue-600">Nationality:</strong>{" "}
                      {formData.nationality}
                    </p>
                    <p className="text-gray-700 mb-2">
                      <strong className="text-blue-600">Signature:</strong>{" "}
                      {formData.signature}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-4 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Profile Image:
                    </h3>
                    {image.length > 0 &&
                      image.map((file, index) => (
                        <div
                          key={index}
                          className="w-24 h-24 overflow-hidden rounded-lg bg-gray-100 shadow-sm"
                        >
                          <img
                            src={URL.createObjectURL(file.blob)}
                            alt={`Shareholder Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Proof of Identity Documents:
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      {editFiles.length > 0 &&
                        editFiles.map((file, index) => (
                          <div
                            key={index}
                            className="w-24 h-24 overflow-hidden rounded-lg bg-gray-100 shadow-sm"
                          >
                            {isImageFile(file.name) ? (
                              <img
                                src={URL.createObjectURL(file.blob)}
                                alt={`Proof of Identity ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <a
                                href={URL.createObjectURL(file.blob)}
                                download={file.name}
                                className="block text-blue-500 hover:underline text-center"
                              >
                                {file.name}
                              </a>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
                <br />
                <hr className="border-t-2 border-gray-300" />
                <br />
                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleEditClick}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 mr-6"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
              <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg max-w-3xl w-full">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="font-bold text-xl">Attention!</strong>
                    <p className="mt-2 text-lg">
                      The address is not a registered shareholder. Please
                      proceed to the registration section and register.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      (window.location.href = `/registerShareholder/${id}`)
                    }
                    className="ml-4 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                  >
                    Register Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete your profile information?"
      />
    </>
  );
}
