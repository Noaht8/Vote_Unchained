import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import getWeb3 from "../../GetWeb3";
import ShareVoting from "../../contracts/ShareVoting.json";
import VoteChart from "./VoteChart";
import OwnerRestrictionMessage from "../OwnerRestrictionMessage";
import NavigationOwner from "./NavigationOwner";
import Footer from "../Footer";
import { ClipLoader } from "react-spinners";

const AllResults = () => {
  const { id } = useParams();
  //   const [ElectionInstance, setElectionInstance] = useState(undefined);
  //   const [web3, setWeb3] = useState(null);
  //   const [account, setAccount] = useState(null);
  const [isOwner, setIsOwner] = useState(null);

  const [proposals, setProposals] = useState([]);
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

        // setWeb3(web3);
        // setElectionInstance(instance);
        // setAccount(accounts[0]);

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

  if (!isOwner) {
    return <OwnerRestrictionMessage />;
  }

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <ClipLoader color="#4A90E2" size={50} />
        <p className="mt-4 text-lg font-semibold text-gray-700">Loading...</p>
      </div>
    );

  return (
    <>
      <NavigationOwner id={id} />
      <div className="p-8 bg-gradient-to-r from-blue-50 via-gray-100 to-blue-50 min-h-screen">
        <h1 className="text-5xl font-extrabold mb-8 text-center text-gray-800">
          All Proposal Results
        </h1>
        {proposals.length > 0 ? (
          proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="flex flex-col lg:flex-row max-w-8xl mx-auto bg-white p-10 rounded-3xl shadow-xl mb-8"
            >
              <div className="lg:w-1/2 lg:pr-6 flex flex-col items-center lg:items-start text-center lg:text-left">
                <h1 className="text-4xl font-bold mb-4">
                  Proposal ID:{" "}
                  <span className="font-medium">{proposal.id}</span>
                </h1>
                <h2 className="text-3xl font-semibold mb-4">
                  The Proposal:{" "}
                  <span className="font-medium text-blue-600">
                    {proposal[1]}
                  </span>
                </h2>
                <h3 className="text-xl font-medium mb-4 text-gray-800">
                  Description:{" "}
                  <span className="font-normal">{proposal[2]}</span>
                </h3>
                <h2 className="text-xl font-medium mb-4 text-gray-800">
                  IPFS HASH:{" "}
                  <span className="font-semibold text-green-600">
                    {proposal[6]}{" "}
                  </span>
                </h2>
              </div>
              <div className="lg:w-1/2 lg:pl-6 mt-8 lg:mt-0">
                <VoteChart
                  forVotes={Number(proposal[4])}
                  againstVotes={Number(proposal[5])}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-lg text-gray-600">
            No proposals available.
          </p>
        )}
      </div>
      <Footer />
    </>
  );
};

export default AllResults;
