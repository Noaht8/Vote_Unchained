import { useState, useEffect } from "react";
//import { useParams } from "react-router-dom";
import getWeb3 from "../../GetWeb3";
import ShareVoting from "../../contracts/ShareVoting.json";
import Footer from "../Footer";
import NavigationOwner from "./NavigationOwner";
import OwnerRestrictionMessage from "../OwnerRestrictionMessage";
import { create } from "ipfs-http-client";
//import { Buffer } from "buffer";
import { ClipLoader } from "react-spinners";

const ipfs = create({ url: "http://127.0.0.1:5001" });

export default function ApproveShareholders() {
  const [ElectionInstance, setElectionInstance] = useState(undefined);
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [isOwner, setIsOwner] = useState(null);

  const [shareholders, setShareholders] = useState([]);
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

        const fetchShareholders = async () => {
          try {
            const shareholderAddresses = await instance.methods
              .getShareholderAddresses()
              .call();
            console.log(shareholderAddresses);
            const shareholderData = await Promise.all(
              shareholderAddresses.map(async (address) => {
                const shareholder = await instance.methods
                  .getShareholder(address)
                  .call();
                let data = "";
                for await (const chunk of ipfs.cat(shareholder[5])) {
                  data += new TextDecoder().decode(chunk);
                }
                const parsedData = JSON.parse(data);

                // Retrieve images and files from IPFS
                const files = await Promise.all(
                  parsedData.image.map(async (file) => {
                    const fileData = [];
                    for await (const chunk of ipfs.cat(file.path)) {
                      fileData.push(chunk);
                    }
                    const blob = new Blob(fileData, { type: file.type });
                    return {
                      blob,
                      name: file.name,
                      url: URL.createObjectURL(blob),
                    };
                  })
                );

                const proofOfIdentityFiles = await Promise.all(
                  parsedData.proofOfIdentity.map(async (file) => {
                    const fileData = [];
                    for await (const chunk of ipfs.cat(file.path)) {
                      fileData.push(chunk);
                    }
                    const blob = new Blob(fileData, { type: file.type });
                    return {
                      blob,
                      name: file.name,
                      url: URL.createObjectURL(blob),
                    };
                  })
                );

                return {
                  address,
                  ...parsedData,
                  approved: shareholder[4],
                  files,
                  proofOfIdentityFiles,
                };
              })
            );
            setShareholders(shareholderData);
            setLoading(false);
          } catch (error) {
            console.error("Error fetching shareholders:", error);
            setLoading(false);
          }
        };
        fetchShareholders();
      } catch (error) {
        alert(
          `Failed to load web3, accounts, or contract. Check console for details (f12).`
        );
      }
    };
    init();
  }, []);

  const handleApproval = async (address, isApproved) => {
    try {
      if (isApproved) {
        await ElectionInstance.methods.disApproveShareholder(address).send({
          from: account,
          gas: 1000000,
          gasPrice: web3.utils.toWei("20", "gwei"),
        });
      } else {
        await ElectionInstance.methods.approveShareholder(address).send({
          from: account,
          gas: 1000000,
          gasPrice: web3.utils.toWei("20", "gwei"),
        });
      }
      setShareholders(
        shareholders.map((shareholder) =>
          shareholder.address === address
            ? { ...shareholder, approved: !isApproved }
            : shareholder
        )
      );
      // Reload the page
      window.location.reload();
    } catch (error) {
      console.error("Error updating shareholder status:", error);
    }
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
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Shareholder Approval
        </h2>
        {shareholders.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-red-500 text-lg font-semibold">
              No shareholders are added yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shareholders.map((shareholder) => (
              <div
                key={shareholder.address}
                className={`p-6 border border-gray-300 rounded-lg shadow-md ${
                  shareholder.approved ? "bg-green-50" : "bg-red-50"
                }`}
              >
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {shareholder.name}
                    </h3>
                    <p className="text-gray-700 mb-1">
                      Shares: {shareholder.shares}%
                    </p>
                    <p className="text-gray-700 mb-1">
                      Contact: {shareholder.contactInfo}
                    </p>
                    <p className="text-gray-700 mb-1">DOB: {shareholder.dob}</p>
                    <p className="text-gray-700 mb-2">
                      Nationality: {shareholder.nationality}
                    </p>
                  </div>

                  <div className="flex-1 mb-4">
                    <div className="mb-2">
                      <h4 className="text-md font-semibold text-gray-800 mb-1">
                        Images:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {shareholder.files.map((file, index) => (
                          <img
                            key={index}
                            src={file.url}
                            alt={file.name}
                            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mb-2">
                      <h4 className="text-md font-semibold text-gray-800 mb-1">
                        Proof of Identity:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {shareholder.proofOfIdentityFiles.map((file, index) => (
                          <a
                            key={index}
                            href={file.url}
                            download={file.name}
                            className="text-blue-600 hover:underline"
                          >
                            {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      className={`px-4 py-2 text-white font-semibold rounded-lg shadow ${
                        shareholder.approved
                          ? "bg-red-500 hover:bg-red-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}
                      onClick={() =>
                        handleApproval(
                          shareholder.address,
                          shareholder.approved
                        )
                      }
                    >
                      {shareholder.approved ? "Disapprove" : "Approve"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
