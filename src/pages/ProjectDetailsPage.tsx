import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

// Mock project data
const projectsData: { [key: string]: any } = {
  uniswap: {
    id: "uniswap",
    name: "Uniswap",
    category: "DEX",
    logo: "🦄",
    website: "https://uniswap.org",
    description:
      "A decentralized trading protocol, facilitating automated trading of decentralized finance (DeFi) tokens.",
    verified: true,
    tags: ["DeFi", "DEX", "Ethereum", "AMM"],
    totalReviews: 1247,
    averageRating: 4.8,
    ratingBreakdown: {
      5: 892,
      4: 234,
      3: 78,
      2: 32,
      1: 11,
    },
    stats: {
      totalValueLocked: "$4.2B",
      dailyVolume: "$1.8B",
      totalUsers: "3.5M+",
      founded: "2018",
    },
    trending: true,
  },
  aave: {
    id: "aave",
    name: "Aave",
    category: "Lending",
    logo: "👻",
    website: "https://aave.com",
    description:
      "Open source and non-custodial liquidity protocol that enables users to earn interest on deposits and borrow assets.",
    verified: true,
    tags: ["DeFi", "Lending", "Multi-chain"],
    totalReviews: 892,
    averageRating: 4.6,
    ratingBreakdown: {
      5: 623,
      4: 178,
      3: 67,
      2: 18,
      1: 6,
    },
    stats: {
      totalValueLocked: "$6.8B",
      totalBorrowed: "$3.2B",
      totalUsers: "890K+",
      founded: "2017",
    },
    trending: false,
  },
};

// Mock reviews data
const reviewsData: { [key: string]: any[] } = {
  uniswap: [
    {
      id: "rev-u1",
      rating: 5,
      title: "Best DEX in the space",
      review:
        "Uniswap has consistently been my go-to DEX for trading. The interface is clean, the liquidity is excellent, and the gas optimization in V3 is impressive. The concentrated liquidity feature has made providing liquidity much more capital efficient.",
      pros: "Excellent liquidity, Great UI/UX, Reliable smart contracts, V3 innovations",
      cons: "High gas fees on Ethereum, Limited cross-chain support initially",
      createdAt: "2024-01-10T14:30:00Z",
      helpful: 234,
      category: "Power User",
      zkVerified: true,
    },
    {
      id: "rev-u2",
      rating: 5,
      title: "Solid and reliable",
      review:
        "Been using Uniswap for 2 years now. Never had any issues with the protocol. The team is constantly innovating and the governance is active. V3 brought some great improvements.",
      pros: "Reliable, Good governance, Active development, Strong community",
      cons: "Can be confusing for beginners, Gas costs",
      createdAt: "2024-01-08T09:15:00Z",
      helpful: 156,
      category: "Long-term User",
      zkVerified: true,
    },
    {
      id: "rev-u3",
      rating: 4,
      title: "Great but expensive",
      review:
        "Love the simplicity and reliability of Uniswap. However, the gas fees can be quite high, especially for smaller trades. Would love to see more L2 integrations.",
      pros: "Simple interface, Reliable, Good token selection",
      cons: "High gas fees, Limited L2 support",
      createdAt: "2024-01-05T16:45:00Z",
      helpful: 89,
      category: "Regular User",
      zkVerified: true,
    },
  ],
  aave: [
    {
      id: "rev-a1",
      rating: 5,
      title: "Outstanding lending protocol",
      review:
        "Aave has been a game-changer for DeFi lending. The variety of assets, stable and variable rates, and features like flash loans make it incredibly versatile. The safety module provides additional security.",
      pros: "Wide asset variety, Flash loans, Safety module, Multi-chain",
      cons: "Complex for beginners, Liquidation risks",
      createdAt: "2024-01-12T11:20:00Z",
      helpful: 198,
      category: "DeFi Expert",
      zkVerified: true,
    },
    {
      id: "rev-a2",
      rating: 4,
      title: "Good yields and features",
      review:
        "Great platform for earning yield on my crypto. The interest rates are competitive and the platform feels secure. The mobile app could use some improvements though.",
      pros: "Good yields, Secure, Multi-chain support",
      cons: "Mobile app needs work, Complex interface",
      createdAt: "2024-01-09T13:50:00Z",
      helpful: 124,
      category: "Yield Farmer",
      zkVerified: true,
    },
  ],
};

const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "rating-high" | "rating-low" | "helpful"
  >("newest");
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const project = id ? projectsData[id] : null;
  const reviews = id ? reviewsData[id] || [] : [];

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 animate-fadeIn">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl flex items-center justify-center mb-8">
          <svg
            className="w-12 h-12 text-slate-500"
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
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          Project Not Found
        </h1>
        <p className="text-xl text-slate-600 mb-8">
          The project you're looking for doesn't exist or hasn't been reviewed
          yet.
        </p>
        <Link to="/">
          <Button size="lg" gradient>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  // Sort and filter reviews
  const sortedAndFilteredReviews = reviews
    .filter((review) => (filterRating ? review.rating === filterRating : true))
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "rating-high":
          return b.rating - a.rating;
        case "rating-low":
          return a.rating - b.rating;
        case "helpful":
          return b.helpful - a.helpful;
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fadeIn">
      {/* Breadcrumb - Enhanced */}
      <nav className="flex items-center space-x-3 text-slate-500">
        <Link
          to="/"
          className="hover:text-blue-600 transition-colors font-medium"
        >
          Projects
        </Link>
        <svg
          className="w-4 h-4"
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
        <span className="text-slate-900 font-semibold">{project.name}</span>
      </nav>

      {/* Project Header - Enhanced */}
      <Card
        variant="elevated"
        className="bg-gradient-to-br from-white/95 to-blue-50/80"
      >
        <CardContent spacing="lg">
          <div className="flex flex-col xl:flex-row gap-10">
            {/* Left side - Project info */}
            <div className="flex-1">
              <div className="flex items-start gap-6 mb-8">
                <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
                  {project.logo}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <h1 className="text-4xl font-bold gradient-text">
                      {project.name}
                    </h1>
                    {project.verified && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                    {project.trending && (
                      <Badge variant="warning" gradient size="lg" pulse>
                        🔥 Trending
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <Badge variant="primary" gradient size="lg">
                      {project.category}
                    </Badge>
                    {project.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                    {project.description}
                  </p>
                  <a
                    href={project.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"
                      />
                    </svg>
                    Visit Official Website
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Project Stats - Enhanced */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(project.stats).map(([key, value]) => (
                  <Card
                    key={key}
                    variant="glass"
                    className="text-center p-4 hover:scale-105 transition-transform duration-300"
                  >
                    <CardContent spacing="sm">
                      <div className="text-xl font-bold gradient-text mb-1">
                        {String(value)}
                      </div>
                      <div className="text-xs text-slate-600 capitalize font-medium">
                        {key.replace(/([A-Z])/g, " $1")}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right side - Rating overview - Enhanced */}
            <div className="xl:w-96">
              <Card
                variant="elevated"
                className="bg-gradient-to-br from-white/95 to-purple-50/80"
              >
                <CardContent spacing="lg">
                  <div className="text-center mb-8">
                    <div className="text-5xl font-bold gradient-text mb-4">
                      {project.averageRating}
                    </div>
                    <div className="flex justify-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-7 h-7 ${
                            i < Math.floor(project.averageRating)
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
                    <div className="text-slate-600 font-medium">
                      {project.totalReviews.toLocaleString()} reviews
                    </div>
                  </div>

                  {/* Rating breakdown - Enhanced */}
                  <div className="space-y-4 mb-8">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = project.ratingBreakdown[rating];
                      const percentage = (count / project.totalReviews) * 100;

                      return (
                        <div key={rating} className="flex items-center gap-3">
                          <div className="flex items-center gap-1 w-12">
                            <span className="text-sm font-medium">
                              {rating}
                            </span>
                            <svg
                              className="w-3 h-3 text-amber-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </div>
                          <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-400 to-yellow-500 h-full transition-all duration-500 ease-out"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-12 text-sm text-slate-600 text-right font-medium">
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <Link to="/submit-review">
                    <Button gradient size="lg" className="w-full">
                      <svg
                        className="w-5 h-5 mr-2"
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
                      Write a Review
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Filters and sorting - Enhanced */}
        <div className="xl:w-80 space-y-6">
          <Card variant="glass">
            <CardHeader spacing="md">
              <CardTitle size="lg" gradient>
                Sort Reviews
              </CardTitle>
            </CardHeader>
            <CardContent spacing="md">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rating-high">Highest Rating</option>
                <option value="rating-low">Lowest Rating</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader spacing="md">
              <CardTitle size="lg" gradient>
                Filter by Rating
              </CardTitle>
            </CardHeader>
            <CardContent spacing="md">
              <div className="space-y-3">
                <button
                  onClick={() => setFilterRating(null)}
                  className={`block w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                    filterRating === null
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                      : "hover:bg-white/60 text-slate-700"
                  }`}
                >
                  All Ratings
                </button>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFilterRating(rating)}
                    className={`block w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                      filterRating === rating
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                        : "hover:bg-white/60 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{rating} Stars</span>
                      <Badge variant="outline" size="sm">
                        {project.ratingBreakdown[rating]}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews list - Enhanced */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold gradient-text">
              Reviews ({sortedAndFilteredReviews.length})
            </h2>
            <Badge variant="primary" gradient size="lg">
              100% ZK Verified
            </Badge>
          </div>

          {sortedAndFilteredReviews.length === 0 ? (
            <Card variant="elevated" className="text-center py-16">
              <CardContent>
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl flex items-center justify-center mb-6">
                  <svg
                    className="w-10 h-10 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  No reviews found
                </h3>
                <p className="text-slate-600">
                  No reviews match your current filter criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedAndFilteredReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Review Card Component - Enhanced
interface ReviewCardProps {
  review: any;
  formatDate: (date: string) => string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, formatDate }) => {
  return (
    <Card variant="elevated" className="review-card">
      <CardHeader>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${
                      i < review.rating ? "text-amber-400" : "text-slate-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <Badge variant="outline" size="sm">
                {review.category}
              </Badge>
              {review.zkVerified && (
                <Badge variant="success" gradient size="sm">
                  🔐 ZK Verified
                </Badge>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {review.title}
            </h3>
          </div>
          <div className="text-right text-sm text-slate-500">
            {formatDate(review.createdAt)}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-slate-700 mb-6 leading-relaxed">{review.review}</p>

        {/* Pros and Cons - Enhanced */}
        {(review.pros || review.cons) && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {review.pros && (
              <Card
                variant="glass"
                className="bg-emerald-50/80 border-emerald-200/60"
              >
                <CardContent spacing="md">
                  <h4 className="font-bold text-emerald-700 mb-3 flex items-center">
                    <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-white mr-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    Pros
                  </h4>
                  <p className="text-emerald-600 leading-relaxed">
                    {review.pros}
                  </p>
                </CardContent>
              </Card>
            )}
            {review.cons && (
              <Card variant="glass" className="bg-red-50/80 border-red-200/60">
                <CardContent spacing="md">
                  <h4 className="font-bold text-red-700 mb-3 flex items-center">
                    <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center text-white mr-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                    </div>
                    Cons
                  </h4>
                  <p className="text-red-600 leading-relaxed">{review.cons}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Review actions - Enhanced */}
        <div className="flex items-center justify-between text-sm border-t border-slate-200/60 pt-6">
          <div className="flex items-center space-x-6">
            <button className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors group">
              <div className="w-8 h-8 bg-slate-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
              </div>
              <span className="font-medium">Helpful ({review.helpful})</span>
            </button>
            <div className="flex items-center space-x-2">
              <Badge variant="primary" gradient size="sm">
                Anonymous Review
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <svg
              className="w-3 h-3 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-slate-500 font-medium">ZK Verified</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectDetailsPage;
