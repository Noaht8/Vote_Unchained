import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { create } from "ipfs-http-client";
//import { Buffer } from "buffer";
import getWeb3 from "../../GetWeb3";
import ShareVoting from "../../contracts/ShareVoting.json";
import Footer from "../Footer";
import NavigationVoter from "./NavigationVoter";
import { ClipLoader } from "react-spinners";

const ipfs = create({ url: "http://127.0.0.1:5001" });

const Vote = () => {
  const { id } = useParams();
  const [ElectionInstance, setElectionInstance] = useState(undefined);
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);

  //const [isOwner, setIsOwner] = useState(null);
  const [isRegistered, setIsRegistered] = useState(null);
  const [isApproved, setIsApproved] = useState(null);
  const [hasVoted, setHasVoted] = useState(null);
  //const [proposalName, setProposalName] = useState("");
  //const [proposalDescription, setProposalDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [proposerInformation, setProposerInformation] = useState("");
  const [proposalCategory, setProposalCategory] = useState("");
  const [contactInformation, setContactInformation] = useState("");
  const [files, setFiles] = useState([]); // State for storing the uploaded files
  const [proposal, setProposal] = useState({
    proposalId: 0,
    name: "",
    description: "",
    totalSharesPercentage: 0,
    forVotesPercentage: 0,
    againstVotesPercentage: 0,
    open: false,
  });

  const [inSupport, setInSupport] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!window.location.hash) {
        window.location = window.location + "#loaded";
        window.location.reload();
      }
      try {
        //Retrieve Data from IPFS
        const retrieveDataFromIpfs = async (ipfsHash) => {
          if (!ipfsHash) return;
          let data = "";
          for await (const chunk of ipfs.cat(ipfsHash)) {
            data += new TextDecoder().decode(chunk);
          }

          const parsedData = await JSON.parse(data);
          //   await setProposalName(parsedData.proposalName);
          //   await setProposalDescription(parsedData.proposalDescription);
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
          setFiles(fileBlobs);
        };
        //Connect Web3
        console.log("Id = ", id);
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

        const approved = await instance.methods
          .isApprovedShareholder(accounts[0])
          .call();
        await setIsApproved(approved);
        console.log("Approved = ", approved);

        const hasVoted = await instance.methods
          .getVoteStatus(accounts[0], id)
          .call();

        await setHasVoted(hasVoted.hasVoted);
        console.log("Vote = ", hasVoted);

        const _proposal = await instance.methods.getProposal(id).call();
        // setProposal(proposal);
        console.log("Propsal = ", _proposal);
        retrieveDataFromIpfs(_proposal[6]);
        await setProposal({
          proposalId: _proposal[0],
          name: _proposal[1],
          description: _proposal[2],
          totalSharesPercentage: _proposal[3],
          forVotesPercentage: _proposal[4],
          againstVotesPercentage: _proposal[5],
          ipfsHash: _proposal[6],
        });

        await console.log("The Proposal = ", proposal);
        setLoading(false);
      } catch (error) {
        //console.error(error);
        alert(
          `Failed to load web3, accounts, or contract. Check console for details (f12).`
        );
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const vote = async () => {
    if (!account) {
      alert("No account found.");
      return;
    }

    try {
      const message = `Verification for address ${account}`;
      const messageHex = web3.utils.utf8ToHex(message);

      // Sign the message
      const signature = await web3.eth.personal.sign(messageHex, account, "");

      // Recover the address from the signature
      const recovered = await web3.eth.personal.ecRecover(
        messageHex,
        signature
      );

      if (recovered.toLowerCase() === account.toLowerCase()) {
        alert("Address verified successfully.");

        // Send the vote transaction with dynamic gas estimation
        const gasEstimate = await ElectionInstance.methods
          .vote(id, inSupport)
          .estimateGas({ from: account });
        const tx = await ElectionInstance.methods.vote(id, inSupport).send({
          from: account,
          gas: gasEstimate,
          gasPrice: web3.utils.toWei("20", "gwei"),
        });

        alert("Vote submitted successfully!");
        console.log("Transaction = ", tx);
        // Optionally update the state or UI to reflect the vote without reloading the page
      } else {
        alert("Address verification failed.");
      }
    } catch (error) {
      console.error("Error occurred:", error);
      alert("An error occurred. Please try again.");
    }
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
      {!isRegistered ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg max-w-3xl w-full">
            <div className="flex items-center justify-between">
              <div>
                <strong className="font-bold text-xl">Attention!</strong>
                <p className="mt-2 text-lg">
                  The address is not a registered shareholder. Please proceed to
                  the registration section and register.
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
      ) : !isApproved ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-6 py-4 rounded-lg shadow-lg max-w-3xl w-full">
            <div className="flex items-center justify-between">
              <div>
                <strong className="font-bold text-xl">Attention!</strong>
                <p className="mt-2 text-lg">
                  The address is not an approved shareholder. Please contact the
                  owner of the contract to approve you.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-gradient-to-r from-blue-50 via-gray-100 to-blue-50 min-h-screen">
          <h1 className="text-4xl font-extrabold mb-6 text-center text-gray-800">
            Vote on Proposal
          </h1>

          {account && (
            <p className="text-xl mb-6 text-center text-gray-600">
              Connected account:{" "}
              <span className="font-semibold">{account}</span>
            </p>
          )}

          {proposal && (
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
              <h1 className="text-3xl font-bold mb-3">
                Proposal ID: <span className="font-medium">{id}</span>
              </h1>
              <h2 className="text-2xl font-semibold mb-5">
                The Proposal:{" "}
                <span className="font-medium text-blue-600">
                  {proposal.name}
                </span>
              </h2>
              <h3 className="text-lg font-medium mb-4 text-gray-800">
                Description:{" "}
                <span className="font-normal">{proposal.description}</span>
              </h3>
              <h2 className="text-lg font-medium mb-4 text-gray-800">
                Voting Closes on:{" "}
                <span className="font-semibold text-red-600">{endDate}</span>
              </h2>
              <h2 className="text-lg font-medium mb-4 text-gray-800">
                Proposer Information:{" "}
                <span className="font-semibold text-green-600">
                  {proposerInformation}
                </span>
              </h2>
              <h2 className="text-lg font-medium mb-4 text-gray-800">
                Proposal Category:{" "}
                <span className="font-semibold text-yellow-600">
                  {proposalCategory}
                </span>
              </h2>
              <h2 className="text-lg font-medium mb-4 text-gray-800">
                Proposer Contact Information:{" "}
                <span className="font-semibold text-purple-600">
                  {contactInformation}
                </span>
              </h2>
              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">
                    Files to Support the Proposal:
                  </h3>
                  {files.map((file, index) => (
                    <div key={index} className="mb-3">
                      <a
                        href={URL.createObjectURL(file.blob)}
                        download={file.name}
                        className="text-blue-500 hover:underline transition duration-300 ease-in-out"
                      >
                        {file.name}
                      </a>
                    </div>
                  ))}
                </div>
              )}
              <div className="my-6 border-t border-gray-200"></div>
              {hasVoted ? (
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                  <div className="bg-green-50 border border-green-300 text-green-800 px-6 py-4 rounded-lg shadow-lg max-w-md w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="font-semibold text-xl">
                          Attention!
                        </strong>
                        <p className="mt-2 text-lg">
                          The address has already voted. You cannot vote again.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={vote} className="space-y-6">
                  <div className="flex flex-col space-y-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        checked={inSupport}
                        onChange={() => setInSupport(true)}
                        className="form-radio text-blue-500"
                      />
                      <span className="text-lg text-gray-800">In Support</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        checked={!inSupport}
                        onChange={() => setInSupport(false)}
                        className="form-radio text-red-500"
                      />
                      <span className="text-lg text-gray-800">Against</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out"
                  >
                    Vote
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}
      <Footer />
    </>
  );
};

export default Vote;
