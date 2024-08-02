import { Chart, registerables } from "chart.js";
import { Pie } from "react-chartjs-2";
import ChartDataLabels from "chartjs-plugin-datalabels";
import PropTypes from "prop-types";

// Register chart components
Chart.register(...registerables, ChartDataLabels);

const VoteChart = ({ forVotes, againstVotes }) => {
  // Data based on props
  const data = {
    labels: ["For Votes", "Against Votes"],
    datasets: [
      {
        data: [forVotes, againstVotes],
        backgroundColor: ["#4CAF50", "#F44336"], // Green and Red
        hoverBackgroundColor: ["#388E3C", "#C62828"],
        borderColor: ["#ffffff", "#ffffff"], // White border
        borderWidth: 2,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 20, // Increased font size
            weight: "bold",
          },
          color: "#333",
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return `${tooltipItem.label}: ${tooltipItem.raw}%`;
          },
        },
      },
      datalabels: {
        color: "#ffffff",
        font: {
          weight: "bold",
          size: 18, // Increased font size
        },
        formatter: (value) => `${value}%`,
        anchor: "end",
        align: "end",
        offset: 10,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-gradient-to-r from-blue-200 via-purple-300 to-pink-200 rounded-lg shadow-lg border border-gray-300">
      <h2 className="text-4xl font-extrabold mb-8 text-center text-gray-800">
        Vote Distribution
      </h2>
      <div className="relative h-96">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

VoteChart.propTypes = {
  forVotes: PropTypes.number.isRequired,
  againstVotes: PropTypes.number.isRequired,
};

{
  /* <div className="p-8 bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 rounded-lg shadow-md">
  <h2 className="text-4xl font-extrabold text-center text-gray-800">Soft Pastel Gradient</h2>
</div> */
}

export default VoteChart;
