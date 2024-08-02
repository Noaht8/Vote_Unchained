import { useState, useEffect } from "react";
import getWeb3 from "../../GetWeb3";
import ShareVoting from "../../contracts/ShareVoting.json";
import Footer from "../Footer";
import NavigationVoter from "./NavigationVoter";
import { useParams } from "react-router-dom";
import { create } from "ipfs-http-client";
import { Buffer } from "buffer";
import { ClipLoader } from "react-spinners";

const ipfs = create({ url: "http://127.0.0.1:5001" });

export default function RegisterShareholder() {
  const { id } = useParams();
  const [ElectionInstance, setElectionInstance] = useState(undefined);
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [isRegistered, setIsRegistered] = useState(null);

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
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  //   const [retrievedData, setRetrievedData] = useState(null);
  //   const [retrievedImage, setRetrievedImage] = useState(null);
  //   const [retrievedPOI, setRetrievedPOI] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length === 0) {
      const data = {
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
      console.log(data);

      // Add image to IPFS
      for (const file of image) {
        const added = await ipfs.add(file);
        data.image.push({ path: added.path, name: file.name });
      }
      await console.log("Image", data.image);
      // Add proofOfIdentity to IPFS
      for (const file of proofOfIdentity) {
        const added = await ipfs.add(file);
        data.proofOfIdentity.push({ path: added.path, name: file.name });
      }

      // Add the combined data to IPFS
      const jsonData = JSON.stringify(data);
      const result = await ipfs.add(Buffer.from(jsonData));

      // Directly use the IPFS hash from result
      const ipfsHash = result.path;
      console.log("ipfsHash = ", ipfsHash);
      registerShareholder(data, ipfsHash);
      setSuccess(true);
    } else {
      setErrors(validationErrors);
    }
  };

  const registerShareholder = async (data, ipfsHash) => {
    const tx = await ElectionInstance.methods
      .registerSelfAsShareholder(data.name, data.shares, ipfsHash)
      .send({
        from: account,
        gas: 1000000,
        gasPrice: web3.utils.toWei("20", "gwei"),
      });

    console.log("Transaction result:", tx);
    alert("Shareholder Registered successfully!");
  };

  //   const handleRetrieveFromIPFS = async () => {
  //     let data = "";
  //     for await (const chunk of ipfs.cat(
  //       "QmUxqhnQbnVCSY5Q4gfgsXL6VANhwcAwFCxEpktzxXRfu6"
  //     )) {
  //       data += new TextDecoder().decode(chunk);
  //     }

  //     const parsedData = JSON.parse(data);
  //     setRetrievedData(parsedData);
  //     // Retrieve the Image from IPFS
  //     const fileImage = [];
  //     for (const file of parsedData.image) {
  //       let fileData = [];
  //       for await (const chunk of ipfs.cat(file.path)) {
  //         fileData.push(chunk);
  //       }
  //       const blob = new Blob(fileData); // Create a Blob from IPFS chunks
  //       fileImage.push({ blob, name: file.name });
  //     }
  //     setRetrievedImage(fileImage);
  //     // Retrieve the proofOfIdentity from IPFS
  //     const filePOI = [];
  //     for (const file of parsedData.proofOfIdentity) {
  //       let fileData = [];
  //       for await (const chunk of ipfs.cat(file.path)) {
  //         fileData.push(chunk);
  //       }
  //       const blob = new Blob(fileData); // Create a Blob from IPFS chunks
  //       filePOI.push({ blob, name: file.name });
  //     }
  //     setRetrievedPOI(filePOI);
  //     console.log("Data = ", parsedData);
  //     console.log("filePOI = ", filePOI);
  //   };
  //   const isImageFile = (fileName) => {
  //     return /\.(jpg|jpeg|png)$/i.test(fileName);
  //   };

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
      {isRegistered ? (
        <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-blue-200 via-blue-300 to-blue-400 p-6">
          <div className="bg-white shadow-lg rounded-lg border border-blue-200 p-6 max-w-3xl w-full text-center">
            <h2 className="text-2xl font-extrabold text-blue-800 mb-4">
              Address Already Registered
            </h2>
            <p className="text-lg text-gray-700 mb-4">
              The Shareholder address is already registered. Please proceed to
              the{" "}
              <a
                href={`/ShareholderInformation/${id}`}
                className="text-blue-600 hover:underline font-semibold"
              >
                Shareholder Profile
              </a>{" "}
              section to view and edit your profile.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              To vote, go to the{" "}
              <a
                href={`/vote/${id}`}
                className="text-blue-600 hover:underline font-semibold"
              >
                Vote
              </a>{" "}
              section.
            </p>
            <p className="text-lg text-gray-700">
              For voting results, visit the{" "}
              <a
                href={`/result/${id}`}
                className="text-blue-600 hover:underline font-semibold"
              >
                Results
              </a>{" "}
              page.
            </p>
          </div>
        </div>
      ) : (
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
                    <span className="font-medium text-blue-500">{account}</span>
                  </p>
                )}
              </center>
            </div>
          </div>

          <div className="max-w-xl mx-auto p-4 border rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">
              Shareholder Registration Form
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
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="shares"
                  className="block text-sm font-medium text-gray-700"
                >
                  Shares Percentage % out of 100
                </label>
                <input
                  id="shares"
                  name="shares"
                  type="number"
                  value={formData.shares}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
                {errors.shares && (
                  <p className="text-red-500 text-sm">{errors.shares}</p>
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
                  id="contactInfo"
                  name="contactInfo"
                  type="text"
                  placeholder="Email or Phone"
                  value={formData.contactInfo}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
                {errors.contactInfo && (
                  <p className="text-red-500 text-sm">{errors.contactInfo}</p>
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
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
                {errors.dob && (
                  <p className="text-red-500 text-sm">{errors.dob}</p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="nationality"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nationality or Country of Residence
                </label>
                <input
                  id="nationality"
                  name="nationality"
                  type="text"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
                {errors.nationality && (
                  <p className="text-red-500 text-sm">{errors.nationality}</p>
                )}
              </div>

              <div className="mb-4">
                <label
                  htmlFor="image"
                  className="block text-sm font-medium text-gray-700"
                >
                  Image
                </label>
                <input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(Array.from(e.target.files))}
                  className="mt-1 block w-full text-sm text-gray-500 file:py-2 file:px-4 file:border file:rounded-md file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="proofOfIdentity"
                  className="block text-sm font-medium text-gray-700"
                >
                  Proof of Identity
                </label>
                <input
                  id="proofOfIdentity"
                  name="proofOfIdentity"
                  type="file"
                  multiple
                  onChange={(e) =>
                    setProofOfIdentity(Array.from(e.target.files))
                  }
                  className="mt-1 block w-full text-sm text-gray-500 file:py-2 file:px-4 file:border file:rounded-md file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="signature"
                  className="block text-sm font-medium text-gray-700"
                >
                  Signature
                </label>
                <input
                  id="signature"
                  name="signature"
                  type="text"
                  value={formData.signature}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                />
                {errors.signature && (
                  <p className="text-red-500 text-sm">{errors.signature}</p>
                )}
              </div>

              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-blue-500 border border-transparent rounded-md shadow-sm text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Submit
              </button>
              {success && (
                <p className="text-green-500 text-sm">
                  You have successfully submitted the form
                </p>
              )}
            </form>
          </div>
        </>
      )}
      <br />
      {/* <button
        onClick={handleRetrieveFromIPFS}
        className="inline-flex items-center px-4 py-2 bg-blue-500 border border-transparent rounded-md shadow-sm text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Click
      </button>
      {retrievedData && (
        <div className="mt-8 bg-white p-8 rounded shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">{"Retrieved Data:"}</h2>
          <p>
            <strong>{"Name"}:</strong> {retrievedData.name}
          </p>
          <p>
            <strong>{"Shares Percentage"}:</strong> {retrievedData.shares}
          </p>
          {retrievedPOI && (
            <div className="mt-4">
              <h3 className="text-xl font-bold mb-2">{"Retrieved Image:"}</h3>

              <img
                src={URL.createObjectURL(retrievedImage[0].blob)}
                alt={`Retrieved ${retrievedImage[0].name}`}
                className="max-w-full h-auto mb-2"
              />

              <h3 className="text-xl font-bold mb-2">{"Retrieved POI:"}</h3>
              {retrievedPOI.map((file, index) => (
                <div key={index} className="mb-4">
                  {isImageFile(file.name) ? (
                    <img
                      src={URL.createObjectURL(file.blob)}
                      alt={`Retrieved ${file.name}`}
                      className="max-w-full h-auto mb-2"
                    />
                  ) : (
                    <a
                      href={URL.createObjectURL(file.blob)}
                      download={file.name}
                      className="text-blue-500 hover:underline"
                    >
                      {"Download"} {file.name}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )} */}
      <Footer />
    </>
  );
}
