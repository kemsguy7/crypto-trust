import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

// Mock data for demonstration
const featuredProjects = [
  {
    id: "uniswap",
    name: "Uniswap",
    category: "DEX",
    rating: 4.8,
    totalReviews: 1247,
    description: "Decentralized exchange protocol on Ethereum",
    logo: "🦄",
    verified: true,
    tags: ["DeFi", "DEX", "Ethereum"],
    trending: true,
    volume24h: "$1.2B",
  },
  {
    id: "aave",
    name: "Aave",
    category: "Lending",
    rating: 4.6,
    totalReviews: 892,
    description: "Open source and non-custodial liquidity protocol",
    logo: "👻",
    verified: true,
    tags: ["DeFi", "Lending", "Multi-chain"],
    trending: false,
    tvl: "$6.8B",
  },
  {
    id: "chainlink",
    name: "Chainlink",
    category: "Oracle",
    rating: 4.7,
    totalReviews: 1053,
    description: "Decentralized oracle network",
    logo: "🔗",
    verified: true,
    tags: ["Oracle", "Infrastructure", "Multi-chain"],
    trending: true,
    price: "$14.23",
  },
  {
    id: "compound",
    name: "Compound",
    category: "Lending",
    rating: 4.4,
    totalReviews: 756,
    description: "Algorithmic, autonomous interest rate protocol",
    logo: "🏛️",
    verified: true,
    tags: ["DeFi", "Lending", "Ethereum"],
    trending: false,
    apr: "5.2%",
  },
];

const categories = [
  "All",
  "DeFi",
  "NFT",
  "Gaming",
  "Infrastructure",
  "Layer 2",
];

const HomePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = featuredProjects.filter((project) => {
    const matchesCategory =
      selectedCategory === "All" || project.tags.includes(selectedCategory);
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-12 animate-fadeIn">
      {/* Hero Section - Enhanced */}
      <section className="relative text-center py-20 px-4 hero-gradient rounded-3xl overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"></div>

        <div className="relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
            Trusted Crypto Reviews
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-4xl mx-auto leading-relaxed">
            Privacy-preserving reviews and ratings for crypto projects, built on
            <span className="gradient-text font-semibold">
              {" "}
              Midnight Network{" "}
            </span>
            with zero-knowledge proofs
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link to="/submit-review">
              <Button
                size="xl"
                gradient
                className="w-full sm:w-auto shadow-2xl hover:shadow-blue-500/25"
              >
                <svg
                  className="w-6 h-6 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Submit Review
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                <svg
                  className="w-6 h-6 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Admin Panel
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center gap-6 mt-12">
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700">
                100% Anonymous
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700">
                ZK Verified
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-slate-700">
                Privacy First
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter - Enhanced */}
      <section className="flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search crypto projects..."
              className="input pl-12 text-base shadow-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                  : "bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 shadow-md backdrop-blur-sm border border-white/60"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Stats Row - Enhanced */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card variant="glass" className="stats-card">
          <CardContent spacing="lg" className="text-center">
            <div className="stats-number mb-2">247</div>
            <div className="text-slate-600 font-medium">Projects Reviewed</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">
              ↗ +12 this week
            </div>
          </CardContent>
        </Card>
        <Card variant="glass" className="stats-card">
          <CardContent spacing="lg" className="text-center">
            <div className="stats-number mb-2">3,948</div>
            <div className="text-slate-600 font-medium">Total Reviews</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">
              ↗ +89 this week
            </div>
          </CardContent>
        </Card>
        <Card variant="glass" className="stats-card">
          <CardContent spacing="lg" className="text-center">
            <div className="stats-number mb-2">100%</div>
            <div className="text-slate-600 font-medium">
              Anonymous & Verified
            </div>
            <div className="text-xs text-blue-600 font-medium mt-1">
              🔐 ZK Protected
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Featured Projects - Enhanced */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold gradient-text">
            Featured Projects
          </h2>
          <div className="flex items-center space-x-3">
            <Badge variant="primary" gradient size="lg">
              {filteredProjects.length} Projects
            </Badge>
            {selectedCategory !== "All" && (
              <Badge variant="outline" size="lg">
                Category: {selectedCategory}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              featured={index < 2}
            />
          ))}
        </div>
      </section>

      {/* How It Works - Enhanced */}
      <Card
        variant="elevated"
        className="p-10 bg-gradient-to-br from-white/95 to-blue-50/80"
      >
        <h2 className="text-3xl font-bold gradient-text mb-10 text-center">
          How CryptoTrust Works
        </h2>
        <div className="grid md:grid-cols-3 gap-10">
          <ProcessStep
            number={1}
            title="Submit Anonymous Review"
            description="Share your experience with crypto projects while maintaining complete privacy through zero-knowledge proofs"
            icon={
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
            }
          />
          <ProcessStep
            number={2}
            title="Admin Verification"
            description="Our admin team verifies authenticity and approves genuine reviews while preserving reviewer anonymity"
            icon={
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            }
          />
          <ProcessStep
            number={3}
            title="Public Transparency"
            description="Approved reviews become publicly visible, helping the community make informed decisions about crypto projects"
            icon={
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
            }
          />
        </div>
      </Card>

      {/* Privacy Features - Enhanced */}
      <section className="grid md:grid-cols-3 gap-8">
        <FeatureCard
          icon={
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          }
          title="Zero-Knowledge Privacy"
          description="Your identity remains completely hidden while proving your authenticity as a real user"
          badge="Core Feature"
        />
        <FeatureCard
          icon={
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          }
          title="Verified Reviews"
          description="Every review is verified for authenticity without compromising reviewer privacy"
          badge="Trusted"
        />
        <FeatureCard
          icon={
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          }
          title="Midnight Network"
          description="Built on cutting-edge blockchain technology with built-in privacy and data protection"
          badge="Powered"
        />
      </section>

      {/* Demo Notice - Enhanced */}
      <Card className="p-6 bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-blue-200/60">
        <div className="flex items-start">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white shadow-lg mr-4 flex-shrink-0">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 text-lg mb-2">
              Demo Version
            </h3>
            <p className="text-slate-600 leading-relaxed">
              This is a demonstration of the CryptoTrust platform on Midnight
              Network testnet. All reviews and ratings shown are examples for
              demonstration purposes. The privacy features and zero-knowledge
              proofs are fully functional.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Project Card Component - Enhanced
interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    category: string;
    rating: number;
    totalReviews: number;
    description: string;
    logo: string;
    verified: boolean;
    tags: string[];
    trending?: boolean;
    [key: string]: any;
  };
  featured?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  featured = false,
}) => {
  return (
    <Card
      variant="elevated"
      className={`${featured ? "project-card-featured" : "project-card"} group`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
              {project.logo}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                  {project.name}
                </CardTitle>
                {project.verified && (
                  <svg
                    className="w-5 h-5 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {project.trending && (
                  <Badge variant="success" gradient size="sm" pulse>
                    🔥 Trending
                  </Badge>
                )}
              </div>
              <Badge variant="primary" gradient size="sm" className="mb-2">
                {project.category}
              </Badge>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-2xl font-bold gradient-text">
                {project.rating}
              </span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(project.rating)
                        ? "text-amber-400"
                        : "text-slate-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-sm text-slate-500">
              {project.totalReviews.toLocaleString()} reviews
            </p>
          </div>
        </div>
        <CardDescription className="leading-relaxed">
          {project.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-6">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="outline" size="sm">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Project Stats */}
        <div className="flex items-center justify-between mb-6 text-sm">
          {Object.entries(project).map(([key, value]) => {
            if (["volume24h", "tvl", "price", "apr"].includes(key)) {
              return (
                <div key={key} className="text-center">
                  <div className="font-semibold text-slate-700 capitalize">
                    {key.replace(/([A-Z])/g, " $1").replace("24h", "24H")}
                  </div>
                  <div className="gradient-text-success font-bold">{value}</div>
                </div>
              );
            }
            return null;
          })}
        </div>

        <Link to={`/project/${project.id}`}>
          <Button
            variant="outline"
            className="w-full group-hover:bg-blue-50 group-hover:border-blue-300 group-hover:text-blue-700 transition-all"
          >
            View Reviews
            <svg
              className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

// Feature Card Component - Enhanced
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  badge,
}) => {
  return (
    <Card
      variant="glass"
      className="hover:shadow-2xl transition-all duration-300 group"
    >
      <CardContent spacing="lg">
        <div className="flex items-start space-x-4">
          <div className="group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              {badge && (
                <Badge variant="outline" size="sm">
                  {badge}
                </Badge>
              )}
            </div>
            <p className="text-slate-600 leading-relaxed">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Process Step Component - Enhanced
interface ProcessStepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ProcessStep: React.FC<ProcessStepProps> = ({
  number,
  title,
  description,
  icon,
}) => {
  return (
    <div className="text-center group">
      <div className="flex justify-center mb-6">
        <div className="group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
      <div className="flex justify-center mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-800 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
          {number}
        </div>
      </div>
      <h3 className="font-bold text-xl text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
};

export default HomePage;
