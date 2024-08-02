import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import getWeb3 from "../../GetWeb3";
import VoteChart from "./VoteChart";
import { create } from "ipfs-http-client";
//import { Buffer } from "buffer";
import NavigationVoter from "./NavigationVoter";
import Footer from "../Footer";
import ShareVoting from "../../contracts/ShareVoting.json";
import { ClipLoader } from "react-spinners";

const ipfs = create({ url: "http://127.0.0.1:5001" });

export default function Result() {
  const { id } = useParams();
  //   const [ElectionInstance, setElectionInstance] = useState(undefined);
  //   const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);

  const [isRegistered, setIsRegistered] = useState(null);
  const [isApproved, setIsApproved] = useState(null);
  //const [proposalName, setProposalName] = useState("");
  //const [proposalDescription, setProposalDescription] = useState("");
  const [endDate, setEndDate] = useState("");
  const [proposerInformation, setProposerInformation] = useState("");
  const [proposalCategory, setProposalCategory] = useState("");
  const [contactInformation, setContactInformation] = useState("");
  const [files, setFiles] = useState([]); // State for storing the uploaded files
  const [forVotes, setForVotes] = useState(0);
  const [againstVotes, setAgainstVotes] = useState(0);
  const [proposal, setProposal] = useState({
    proposalId: 0,
    name: "",
    description: "",
    totalSharesPercentage: 0,
    forVotesPercentage: 0,
    againstVotesPercentage: 0,
    open: false,
  });
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

        // setWeb3(web3);
        // setElectionInstance(instance);
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

        const _proposal = await instance.methods.getProposal(id).call();
        // setProposal(proposal);
        console.log("Propsal = ", _proposal);
        const handleProposal = (_proposal) => {
          // Convert bigint to number
          const forVotes = Number(_proposal[4]);
          const againstVotes = Number(_proposal[5]);

          // Set state with converted values
          setForVotes(forVotes);
          setAgainstVotes(againstVotes);
        };
        handleProposal(_proposal);
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
          <div className="bg-red-100 border border-red-400 text-red-700 px-8 py-6 rounded-xl shadow-2xl max-w-4xl w-full">
            <div className="flex items-center justify-between">
              <div>
                <strong className="font-extrabold text-2xl">Attention!</strong>
                <p className="mt-2 text-lg">
                  The address is not a registered shareholder. Please proceed to
                  the registration section and register.
                </p>
              </div>
              <button
                onClick={() =>
                  (window.location.href = `/registerShareholder/${id}`)
                }
                className="ml-4 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl shadow-md hover:bg-red-700 transition duration-300"
              >
                Register Now
              </button>
            </div>
          </div>
        </div>
      ) : !isApproved ? (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-8 py-6 rounded-xl shadow-2xl max-w-4xl w-full">
            <div className="flex items-center justify-between">
              <div>
                <strong className="font-extrabold text-2xl">Attention!</strong>
                <p className="mt-2 text-lg">
                  The address is not an approved shareholder. Please contact the
                  owner of the contract to approve you.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-gradient-to-r from-blue-50 via-gray-100 to-blue-50 min-h-screen">
          <h1 className="text-5xl font-extrabold mb-8 text-center text-gray-800">
            Proposal Vote Result
          </h1>

          {account && (
            <p className="text-2xl mb-6 text-center text-gray-600">
              Connected account:{" "}
              <span className="font-semibold">{account}</span>
            </p>
          )}

          {proposal && (
            <div className="flex flex-col lg:flex-row max-w-6xl mx-auto bg-white p-10 rounded-3xl shadow-xl">
              <div className="lg:w-1/2 lg:pr-6">
                <h1 className="text-4xl font-bold mb-4">
                  Proposal ID: <span className="font-medium">{id}</span>
                </h1>
                <h2 className="text-3xl font-semibold mb-4">
                  The Proposal:{" "}
                  <span className="font-medium text-blue-600">
                    {proposal.name}
                  </span>
                </h2>
                <h3 className="text-xl font-medium mb-4 text-gray-800">
                  Description:{" "}
                  <span className="font-normal">{proposal.description}</span>
                </h3>
                <h2 className="text-xl font-medium mb-4 text-gray-800">
                  Voting Closes on:{" "}
                  <span className="font-semibold text-red-600">{endDate}</span>
                </h2>
                <h2 className="text-xl font-medium mb-4 text-gray-800">
                  Proposer Information:{" "}
                  <span className="font-semibold text-green-600">
                    {proposerInformation}
                  </span>
                </h2>
                <h2 className="text-xl font-medium mb-4 text-gray-800">
                  Proposal Category:{" "}
                  <span className="font-semibold text-yellow-600">
                    {proposalCategory}
                  </span>
                </h2>
                <h2 className="text-xl font-medium mb-4 text-gray-800">
                  Proposer Contact Information:{" "}
                  <span className="font-semibold text-purple-600">
                    {contactInformation}
                  </span>
                </h2>
                {files.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">
                      Files to Support the Proposal:
                    </h3>
                    {files.map((file, index) => (
                      <div key={index} className="mb-4">
                        <a
                          href={URL.createObjectURL(file.blob)}
                          download={file.name}
                          className="text-blue-500 hover:underline transition duration-300"
                        >
                          {file.name}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="lg:w-1/2 lg:pl-6 mt-8 lg:mt-0">
                <VoteChart forVotes={forVotes} againstVotes={againstVotes} />
              </div>
            </div>
          )}
        </div>
      )}
      <Footer />
    </>
  );
}

{
  /* <NavigationVoter id={id} />
<VoteChart forVotes={5} againstVotes={7} />

<Footer /> */
}
