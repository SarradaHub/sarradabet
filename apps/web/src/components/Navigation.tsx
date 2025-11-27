import { Link } from "react-router-dom";
import { useState } from "react";
import CreateCategoryModal from "./CreateCategoryModal";
import { Button } from "./ui/Button";
import { Plus, Settings } from "lucide-react";

interface NavigationProps {
  onOpenCreateModal: () => void;
  onCategoryCreated?: () => void;
}

const Navigation = ({
  onOpenCreateModal,
  onCategoryCreated,
}: NavigationProps) => {
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCategoryCreated = () => {
    setShowCreateCategoryModal(false);
    onCategoryCreated?.();
  };

  return (
    <>
      <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-12 flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                SarradaBet
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-4">
              <Link to="/admin/login">
                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={Settings}
                  className="border border-gray-600 text-gray-300 hover:bg-gray-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Login
                </Button>
              </Link>
              <Button
                onClick={() => setShowCreateCategoryModal(true)}
                variant="primary"
                size="md"
                leftIcon={Plus}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Nova Categoria
              </Button>
              <Button
                onClick={onOpenCreateModal}
                variant="primary"
                size="md"
                leftIcon={Plus}
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-semibold"
              >
                Nova Aposta
              </Button>
            </div>

            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:text-white"
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-700 py-4">
              <div className="flex flex-col space-y-3">
                <Link to="/admin/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="secondary"
                    size="md"
                    leftIcon={Settings}
                    className="w-full border border-gray-600 text-gray-300 hover:bg-gray-700 text-left"
                  >
                    Login
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    setShowCreateCategoryModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                  variant="primary"
                  size="md"
                  leftIcon={Plus}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 text-left"
                >
                  Nova Categoria
                </Button>
                <Button
                  onClick={() => {
                    onOpenCreateModal();
                    setIsMobileMenuOpen(false);
                  }}
                  variant="primary"
                  size="md"
                  leftIcon={Plus}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400 text-left font-semibold"
                >
                  Nova Aposta
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <CreateCategoryModal
        isOpen={showCreateCategoryModal}
        onClose={() => setShowCreateCategoryModal(false)}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  );
};

export default Navigation;
