//import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import CreateProposal from "./components/ProposalVoting/CreateProposal";
import RegisterShareholder from "./components/ProposalVoting/RegisterShareholder";
import EditProposals from "./components/ProposalVoting/EditProposals";
import ApproveShareholders from "./components/ProposalVoting/ApproveShareholders";
import ShareholderInformation from "./components/ProposalVoting/ShareholderInformation";
import Vote from "./components/ProposalVoting/Vote";
import Result from "./components/ProposalVoting/Result";
import AllResults from "./components/ProposalVoting/AllResults";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Shareholder Proposal Voting Routes */}
        <Route path="/createProposal" element={<CreateProposal />} />
        <Route path="/vote/:id" element={<Vote />} />
        <Route
          path="/registerShareholder/:id"
          element={<RegisterShareholder />}
        />
        <Route path="/result/:id" element={<Result />} />
        <Route
          path="/ShareholderInformation/:id"
          element={<ShareholderInformation />}
        />
        <Route path="/editProposals" element={<EditProposals />} />
        <Route path="/approveShareholders" element={<ApproveShareholders />} />
        <Route path="/allResults" element={<AllResults />} />
      </Routes>
    </Router>
  );
}

export default App;
