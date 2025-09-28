import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

// Mock data for pending reviews
const pendingReviews = [
  {
    id: "rev-001",
    projectName: "Uniswap",
    category: "DeFi",
    rating: 5,
    title: "Excellent DEX with great liquidity",
    review:
      "I have been using Uniswap for over a year now and it has been an amazing experience. The interface is intuitive, gas fees are reasonable, and the liquidity is always good. The V3 update with concentrated liquidity has made it even better for LPs.",
    pros: "Great UI/UX, High liquidity, Reliable smart contracts, Active development",
    cons: "Gas fees can be high during network congestion, Limited to Ethereum ecosystem initially",
    submittedAt: "2024-01-15T10:30:00Z",
    proofVerified: true,
    hasAttachments: true,
    status: "pending",
    submissionId: "ZK-PROOF-001",
  },
  {
    id: "rev-002",
    projectName: "SomeScamToken",
    category: "DeFi",
    rating: 1,
    title: "Obvious rug pull - lost my funds",
    review:
      "This project looked promising initially but turned out to be a complete scam. The developers disappeared with all the funds and the token value went to zero overnight. Stay away from this project at all costs.",
    pros: "Initially good marketing",
    cons: "Complete scam, Rug pull, Lost all funds, No real utility, Developers disappeared",
    submittedAt: "2024-01-14T15:45:00Z",
    proofVerified: true,
    hasAttachments: false,
    status: "pending",
    submissionId: "ZK-PROOF-002",
  },
  {
    id: "rev-003",
    projectName: "Chainlink",
    category: "Oracle",
    rating: 4,
    title: "Solid oracle network with room for improvement",
    review:
      "Chainlink has established itself as the go-to oracle solution in DeFi. The network is reliable and has good decentralization. However, I think the tokenomics could be improved and the fees are sometimes high for smaller projects.",
    pros: "Reliable oracle feeds, Good decentralization, Wide adoption, Strong partnerships",
    cons: "High fees, Complex tokenomics, Competition from other oracles emerging",
    submittedAt: "2024-01-14T09:20:00Z",
    proofVerified: true,
    hasAttachments: true,
    status: "pending",
    submissionId: "ZK-PROOF-003",
  },
  {
    id: "rev-004",
    projectName: "Aave",
    category: "Lending",
    rating: 5,
    title: "Best lending protocol in DeFi",
    review:
      "Aave continues to be the most innovative lending protocol. The flash loans feature is revolutionary and the safety module provides great security. Multi-chain expansion has been seamless.",
    pros: "Innovation, Security, Multi-chain, Flash loans",
    cons: "Complex for beginners, High gas costs on Ethereum",
    submittedAt: "2024-01-13T14:15:00Z",
    proofVerified: true,
    hasAttachments: false,
    status: "approved",
    submissionId: "ZK-PROOF-004",
  },
  {
    id: "rev-005",
    projectName: "BadProject",
    category: "DeFi",
    rating: 2,
    title: "Poor execution and broken promises",
    review:
      "This project promised a lot but delivered very little. The team is unresponsive and the technology is outdated.",
    pros: "Good initial idea",
    cons: "Poor execution, Unresponsive team, Outdated tech",
    submittedAt: "2024-01-12T11:30:00Z",
    proofVerified: true,
    hasAttachments: true,
    status: "rejected",
    submissionId: "ZK-PROOF-005",
  },
];

// Review Card Component
interface ReviewCardProps {
  review: any;
  isSelected: boolean;
  onSelect: () => void;
  onAction: (reviewId: string, action: "approve" | "reject") => void;
  isLoading: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  isSelected,
  onSelect,
  onAction,
  isLoading,
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return {
          badge: "warning" as const,
          cardClass: "review-card-pending",
          icon: "⏳",
          text: "Pending Review",
        };
      case "approved":
        return {
          badge: "success" as const,
          cardClass: "review-card",
          icon: "✅",
          text: "Approved",
        };
      case "rejected":
        return {
          badge: "danger" as const,
          cardClass: "review-card-rejected",
          icon: "❌",
          text: "Rejected",
        };
      default:
        return {
          badge: "default" as const,
          cardClass: "review-card",
          icon: "📝",
          text: "Unknown",
        };
    }
  };

  const statusConfig = getStatusConfig(review.status);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card
      variant="elevated"
      className={`${statusConfig.cardClass} transition-all duration-300 ${
        isSelected ? "ring-2 ring-blue-500 shadow-2xl" : ""
      }`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-3xl">
                {review.projectName === "Uniswap"
                  ? "🦄"
                  : review.projectName === "Chainlink"
                  ? "🔗"
                  : review.projectName === "Aave"
                  ? "👻"
                  : "🔷"}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <CardTitle className="text-xl">
                    {review.projectName}
                  </CardTitle>
                  <Badge variant="primary" gradient size="sm">
                    {review.category}
                  </Badge>
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "text-amber-400"
                            : "text-slate-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="text-lg font-bold gradient-text ml-2">
                      {review.rating}/5
                    </span>
                  </div>
                </div>
                <CardDescription className="font-medium text-lg">
                  {review.title}
                </CardDescription>
              </div>
            </div>

            {/* Review metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-slate-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-slate-600">
                  {formatDate(review.submittedAt)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-emerald-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-emerald-600 font-medium">
                  ZK Verified
                </span>
              </div>
              {review.hasAttachments && (
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />
                  </svg>
                  <span className="text-blue-600 font-medium">
                    Has Attachments
                  </span>
                </div>
              )}
              <Badge variant="outline" size="sm">
                ID: {review.submissionId}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant={statusConfig.badge} gradient size="lg">
              {statusConfig.icon} {statusConfig.text}
            </Badge>
            <button
              onClick={onSelect}
              className="text-slate-400 hover:text-slate-600 transition-all duration-200 p-2 rounded-xl hover:bg-white/60"
            >
              <svg
                className={`w-6 h-6 transition-transform duration-300 ${
                  isSelected ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>
      </CardHeader>

      {isSelected && (
        <CardContent className="space-y-6 border-t border-slate-200/60 pt-6">
          {/* Full Review Content */}
          <div className="prose prose-slate max-w-none">
            <h4 className="font-semibold text-slate-900 mb-3">
              Review Content
            </h4>
            <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl">
              {review.review}
            </p>
          </div>

          {/* Pros and Cons */}
          {(review.pros || review.cons) && (
            <div className="grid md:grid-cols-2 gap-6">
              {review.pros && (
                <Card
                  variant="glass"
                  className="bg-emerald-50/80 border-emerald-200/60"
                >
                  <CardContent spacing="md">
                    <h4 className="font-semibold text-emerald-700 mb-3 flex items-center">
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
                    <p className="text-emerald-600 text-sm leading-relaxed">
                      {review.pros}
                    </p>
                  </CardContent>
                </Card>
              )}
              {review.cons && (
                <Card
                  variant="glass"
                  className="bg-red-50/80 border-red-200/60"
                >
                  <CardContent spacing="md">
                    <h4 className="font-semibold text-red-700 mb-3 flex items-center">
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
                    <p className="text-red-600 text-sm leading-relaxed">
                      {review.cons}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {review.status === "pending" && (
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-200/60">
              <Button
                variant="success"
                size="lg"
                onClick={() => onAction(review.id, "approve")}
                isLoading={isLoading}
                disabled={isLoading}
                gradient
                className="flex-1"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Approve Review
              </Button>
              <Button
                variant="danger"
                size="lg"
                onClick={() => onAction(review.id, "reject")}
                isLoading={isLoading}
                disabled={isLoading}
                gradient
                className="flex-1"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Reject Review
              </Button>
            </div>
          )}

          {/* Status Actions for Approved/Rejected */}
          {review.status !== "pending" && (
            <div className="pt-6 border-t border-slate-200/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant={statusConfig.badge} gradient size="lg">
                    {statusConfig.icon} Review {review.status}
                  </Badge>
                  <span className="text-sm text-slate-500">
                    Action completed on {formatDate(review.submittedAt)}
                  </span>
                </div>
                <Button variant="outline" size="sm">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  View Details
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

const AdminModerationPage: React.FC = () => {
  const [reviews, setReviews] = useState(pendingReviews);
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleReviewAction = async (
    reviewId: string,
    action: "approve" | "reject"
  ) => {
    setActionLoading(reviewId);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              status: action === "approve" ? "approved" : "rejected",
            }
          : review
      )
    );

    setActionLoading(null);
    setSelectedReview(null);
  };

  const filteredReviews = reviews.filter((review) => {
    if (filter === "all") return true;
    return review.status === filter;
  });

  const stats = {
    total: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-5xl md:text-6xl font-bold hero-title mb-4">
          Admin Moderation
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Review and moderate anonymous crypto project reviews with
          <span className="gradient-text font-semibold">
            {" "}
            zero-knowledge verification
          </span>
        </p>
      </div>

      {/* Admin Status & Quick Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200 rounded-2xl shadow-lg">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="font-semibold text-emerald-700">
              Admin Authenticated
            </span>
            <Badge variant="success" gradient size="sm">
              Verified
            </Badge>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="outline" size="lg">
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export Reports
          </Button>
          <Button variant="primary" gradient size="lg">
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass" className="stats-card group">
          <CardContent spacing="lg" className="text-center">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-xl mb-4 group-hover:scale-110 transition-transform duration-300">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold mb-2">{stats.total}</div>
            <div className="text-slate-600 font-medium">Total Reviews</div>
            <Badge variant="primary" gradient size="sm" className="mt-2">
              All Time
            </Badge>
          </CardContent>
        </Card>

        <Card variant="glass" className="stats-card group">
          <CardContent spacing="lg" className="text-center">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl mb-4 group-hover:scale-110 transition-transform duration-300">
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-amber-600 mb-2">
              {stats.pending}
            </div>
            <div className="text-slate-600 font-medium">Pending</div>
            <Badge variant="warning" gradient size="sm" className="mt-2">
              Awaiting Review
            </Badge>
          </CardContent>
        </Card>

        <Card variant="glass" className="stats-card group">
          <CardContent spacing="lg" className="text-center">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center text-white shadow-xl mb-4 group-hover:scale-110 transition-transform duration-300">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {stats.approved}
            </div>
            <div className="text-slate-600 font-medium">Approved</div>
            <Badge variant="success" gradient size="sm" className="mt-2">
              Published
            </Badge>
          </CardContent>
        </Card>

        <Card variant="glass" className="stats-card group">
          <CardContent spacing="lg" className="text-center">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-xl mb-4 group-hover:scale-110 transition-transform duration-300">
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {stats.rejected}
            </div>
            <div className="text-slate-600 font-medium">Rejected</div>
            <Badge variant="danger" gradient size="sm" className="mt-2">
              Declined
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="glass" className="p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h2 className="text-2xl font-bold gradient-text">Review Queue</h2>
          <div className="flex flex-wrap gap-3">
            {(["all", "pending", "approved", "rejected"] as const).map(
              (filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 capitalize ${
                    filter === filterOption
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                      : "bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 shadow-md backdrop-blur-sm border border-white/60"
                  }`}
                >
                  {filterOption} (
                  {filterOption === "all" ? stats.total : stats[filterOption]})
                </button>
              )
            )}
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-6">
        {filteredReviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            isSelected={selectedReview === review.id}
            onSelect={() =>
              setSelectedReview(selectedReview === review.id ? null : review.id)
            }
            onAction={handleReviewAction}
            isLoading={actionLoading === review.id}
          />
        ))}

        {filteredReviews.length === 0 && (
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
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                No reviews found
              </h3>
              <p className="text-slate-600 text-lg">
                No reviews match the current filter criteria.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Privacy Notice */}
      <Card className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-blue-200/60">
        <CardContent spacing="lg">
          <div className="flex items-start">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-xl mr-6 flex-shrink-0">
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
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-xl mb-3">
                Privacy Protection Active
              </h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                All reviews are submitted anonymously via zero-knowledge proofs.
                No personal information about reviewers is accessible, even to
                admins. You can only moderate content quality and authenticity,
                not trace reviewers.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="primary" gradient size="sm">
                  🔐 ZK Protected
                </Badge>
                <Badge variant="success" gradient size="sm">
                  🎭 Anonymous
                </Badge>
                <Badge variant="warning" gradient size="sm">
                  🛡️ Secure
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminModerationPage;
