import { useNavigate } from "react-router-dom";
import { BuildingOfficeIcon, ClipboardDocumentListIcon, DocumentTextIcon, ClockIcon } from "@heroicons/react/24/outline";
import authAPI from "@/APi/auth";

const ContractorDashboard = () => {
  const navigate = useNavigate();
  const currentUser = authAPI.getCurrentUser();

  const handleCardClick = (route) => {
    navigate(route);
  };

  const statCards = [
    {
      name: "Projects",
      description: "View and manage your construction projects",
      icon: BuildingOfficeIcon,
      color: "bg-blue-500",
      route: "/contractor-projects",  // Updated to match routes.jsx
      actionText: "Go to Projects"
    },
    {
      name: "Reports",
      description: "Access and create project reports",
      icon: DocumentTextIcon,
      color: "bg-yellow-500",
      route: "/contractor-reports",  // Updated to match routes.jsx
      actionText: "Manage Reports"
    },
    {
      name: "Materials",
      description: "Manage construction materials",
      icon: ClockIcon,
      color: "bg-purple-500",
      route: "/materials",  // Updated to match routes.jsx
      actionText: "View Materials"
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {currentUser?.firstName}!</h1>
        <p className="text-lg opacity-90">
          Manage your construction projects and keep track of everything in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <div 
            key={card.name} 
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            <div className={`${card.color} p-4`}>
              <card.icon className="h-8 w-8 text-white" />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{card.name}</h2>
              <p className="text-gray-600 mb-4">{card.description}</p>
              <button
                onClick={() => handleCardClick(card.route)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {card.actionText}
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Tips</h2>
        <ul className="space-y-2 text-gray-600">
          <li>• Click on any card above to navigate to that section</li>
          <li>• Create new reports to keep stakeholders updated</li>
          <li>• Check your tasks regularly to stay on schedule</li>
          <li>• Monitor project progress through the Projects section</li>
        </ul>
      </div>
    </div>
  );
};

export default ContractorDashboard;