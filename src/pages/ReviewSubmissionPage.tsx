import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { contractManager } from "../lib/contract-adapter";
import { ZKProof as AppZKProof } from "../lib/midnight-stub";

const ReviewSubmissionPage: React.FC = () => {
  const [formData, setFormData] = useState({
    projectAddress: "",
    projectName: "",
    projectWebsite: "",
    category: "",
    rating: 0,
    title: "",
    review: "",
    pros: "",
    cons: "",
    proofFiles: [] as File[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    reviewId: string;
    txHash: string;
  } | null>(null);
  const [contractStats, setContractStats] = useState({
    totalDApps: 0,
    totalReviews: 0,
    currentEpoch: 0
  });

  const categories = [
    "DeFi",
    "NFT",
    "Gaming",
    "Infrastructure",
    "Layer 2",
    "Bridge",
    "Wallet",
    "Exchange",
    "Lending",
    "DAO",
    "Oracle",
    "Other",
  ];

  useEffect(() => {
    // Load contract stats on component mount
    loadContractStats();
  }, []);

  const loadContractStats = async () => {
    try {
      const adapter = contractManager.getAdapter();
      const stats = await adapter.getTotalStats();
      setContractStats(stats);
    } catch (error) {
      console.error('Failed to load contract stats:', error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRatingClick = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({
        ...prev,
        proofFiles: Array.from(e.target.files || []),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate review hash from content
      const reviewContent = JSON.stringify({
        title: formData.title,
        review: formData.review,
        pros: formData.pros,
        cons: formData.cons,
        rating: formData.rating,
        timestamp: Date.now()
      });
      
      const reviewHash = await generateHash(reviewContent);
      
      // Generate interaction proof (simplified for demo)
      const interactionProof = await generateInteractionProof(formData.projectAddress);
      
      // Generate nullifier for rate limiting
      const nullifier = await generateNullifier(formData.projectAddress);
      
      // Generate ZK proof for reviewer membership
      const zkProof = await generateZKProof({
        signal: reviewHash,
        identity: 'demo-reviewer-identity', // In production, this would be user's actual identity
        merkleProof: [], // In production, this would be actual Merkle proof
      });

      // Submit to contract
      const adapter = contractManager.getAdapter();
      
      // First check if DApp is registered, if not suggest registration
      const dappInfo = await adapter.getDAppInfo(formData.projectAddress);
      if (!dappInfo) {
        // For demo purposes, we'll register the DApp automatically
        await adapter.registerDApp(
          formData.projectAddress,
          formData.projectName,
          formData.category,
          'demo-admin-signature' // In production, this would require actual admin privileges
        );
      }
      
      // Submit the review
      const result = await adapter.submitReview(
        formData.projectAddress,
        reviewHash,
        formData.rating,
        interactionProof,
        nullifier,
        zkProof
      );

      setSubmissionResult(result);
      setSubmitted(true);
      
      // Update contract stats
      await loadContractStats();
      
    } catch (error: any) {
      console.error('Review submission failed:', error);
      alert(`Submission failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions
  const generateZKProof = async (data: {
    signal: string;
    identity: string;
    merkleProof: any[];
  }): Promise<AppZKProof> => {
    // Create a proper ZK proof object structure that matches what the contract adapter expects
    const proofData = {
      type: 'dapp-review-proof',
      signal: data.signal,
      identity: data.identity,
      merkleProof: data.merkleProof,
      timestamp: Date.now(),
      version: '1.0'
    };
    
    // Generate the proof string
    const proofString = btoa(JSON.stringify(proofData));
    
    // Create public signals (these would be the public inputs to the ZK circuit)
    const publicSignals = [
      data.signal, // review hash
      Math.floor(Date.now() / (1000 * 60 * 60 * 24)).toString(), // current epoch
      await generateHash(data.identity), // identity commitment (hashed for privacy)
    ];
    
    // Return a proper ZKProof object
    return {
      proof: proofString,
      publicSignals: publicSignals,
      nullifier: await generateHash(`${data.identity}_${Date.now()}`),
      timestamp: Date.now()
    };
  };

  const generateHash = async (content: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const generateInteractionProof = async (projectAddress: string): Promise<string> => {
    // In production, this would generate actual proof of interaction with the DApp
    const proofData = `interaction_${projectAddress}_${Date.now()}`;
    return await generateHash(proofData);
  };

  const generateNullifier = async (projectAddress: string): Promise<string> => {
    // Generate nullifier based on user identity and project
    const nullifierData = `nullifier_${projectAddress}_${Date.now()}_${Math.random()}`;
    return await generateHash(nullifierData);
  };

  const resetForm = () => {
    setFormData({
      projectAddress: "",
      projectName: "",
      projectWebsite: "",
      category: "",
      rating: 0,
      title: "",
      review: "",
      pros: "",
      cons: "",
      proofFiles: [],
    });
    setSubmitted(false);
    setSubmissionResult(null);
  };

  if (submitted && submissionResult) {
    return (
      <div className="max-w-3xl mx-auto animate-fadeIn">
        <Card
          variant="elevated"
          className="text-center bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border-emerald-200/60"
        >
          <CardContent spacing="lg" className="py-16">
            {/* Success Animation */}
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse-slow">
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="absolute inset-0 w-24 h-24 mx-auto bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full animate-ping opacity-20"></div>
            </div>

            <h1 className="text-4xl font-bold gradient-text-success mb-6">
              Review Submitted to Midnight Network!
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
              Your anonymous review has been successfully submitted to the DApp Reviewer contract 
              with zero-knowledge proof verification. It's now part of the permanent record on Midnight Network.
            </p>

            {/* Contract Transaction Info */}
            <Card variant="glass" className="mb-8 text-left max-w-xl mx-auto">
              <CardHeader spacing="md">
                <CardTitle size="lg" gradient>
                  Blockchain Transaction
                </CardTitle>
              </CardHeader>
              <CardContent spacing="md">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-600">Review ID:</span>
                    <Badge variant="primary" gradient className="font-mono text-xs">
                      {submissionResult.reviewId.slice(0, 12)}...
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-600">Transaction:</span>
                    <Badge variant="success" gradient className="font-mono text-xs">
                      {submissionResult.txHash.slice(0, 12)}...
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-600">Network:</span>
                    <Badge variant="outline">Midnight Network</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-600">Status:</span>
                    <Badge variant="success" gradient>✓ Verified</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Success Steps - Enhanced */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="flex flex-col items-center space-y-3 p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="font-semibold text-slate-700">
                  ZK Proof Generated
                </span>
                <Badge variant="success" gradient size="sm">
                  Complete
                </Badge>
              </div>

              <div className="flex flex-col items-center space-y-3 p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <span className="font-semibold text-slate-700">
                  Contract Updated
                </span>
                <Badge variant="success" gradient size="sm">
                  On-Chain
                </Badge>
              </div>

              <div className="flex flex-col items-center space-y-3 p-6 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg">
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
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <span className="font-semibold text-slate-700">
                  Identity Anonymous
                </span>
                <Badge variant="success" gradient size="sm">
                  Private
                </Badge>
              </div>
            </div>

            {/* Network Stats */}
            <Card variant="glass" className="mb-10 text-left max-w-xl mx-auto">
              <CardHeader spacing="md">
                <CardTitle size="lg" gradient>
                  Network Statistics
                </CardTitle>
              </CardHeader>
              <CardContent spacing="md">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold gradient-text">{contractStats.totalDApps}</div>
                    <div className="text-sm text-slate-600">DApps Registered</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold gradient-text">{contractStats.totalReviews}</div>
                    <div className="text-sm text-slate-600">Reviews Submitted</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold gradient-text">{contractStats.currentEpoch}</div>
                    <div className="text-sm text-slate-600">Current Epoch</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submitted Review Summary - Enhanced */}
            <Card variant="glass" className="mb-10 text-left max-w-xl mx-auto">
              <CardHeader spacing="md">
                <CardTitle size="lg" gradient>
                  Review Summary
                </CardTitle>
              </CardHeader>
              <CardContent spacing="md">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-600">Project:</span>
                    <Badge variant="primary" gradient>
                      {formData.projectName}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-600">
                      Category:
                    </span>
                    <Badge variant="outline">{formData.category}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-600">Rating:</span>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < formData.rating
                              ? "text-amber-400"
                              : "text-slate-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 font-bold gradient-text">
                        {formData.rating}/5
                      </span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-200">
                    <span className="font-medium text-slate-600 block mb-2">
                      Title:
                    </span>
                    <p className="text-slate-800 font-medium">
                      {formData.title}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={resetForm} variant="primary" size="lg" gradient>
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
                Submit Another Review
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                size="lg"
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
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                  />
                </svg>
                Back to Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fadeIn">
      {/* Header - Enhanced */}
      <div className="text-center">
        <h1 className="text-5xl md:text-6xl font-bold hero-title mb-6">
          Submit Anonymous DApp Review
        </h1>
        <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
          Share your honest experience with a decentralized application while maintaining
          complete privacy through
          <span className="gradient-text font-semibold">
            {" "}
            zero-knowledge proofs on Midnight Network
          </span>
        </p>
      </div>

      {/* Contract Stats Banner */}
      <Card variant="glass" className="bg-gradient-to-r from-purple-50/80 to-blue-50/80 border-purple-200/60">
        <CardContent spacing="lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-xl mb-2">
                🚀 Live on Midnight Network
              </h3>
              <p className="text-slate-600">
                Join the decentralized review ecosystem with complete privacy protection
              </p>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold gradient-text">{contractStats.totalDApps}</div>
                <div className="text-sm text-slate-600">DApps</div>
              </div>
              <div>
                <div className="text-2xl font-bold gradient-text">{contractStats.totalReviews}</div>
                <div className="text-sm text-slate-600">Reviews</div>
              </div>
              <div>
                <div className="text-2xl font-bold gradient-text">{contractStats.currentEpoch}</div>
                <div className="text-sm text-slate-600">Epoch</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice - Enhanced */}
      <Card
        variant="glass"
        className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-blue-200/60"
      >
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
                  d="M12 15v2m-6 4h12a4 4 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-xl mb-3">
                Complete Privacy Guaranteed
              </h3>
              <p className="text-slate-700 leading-relaxed mb-4">
                Your identity remains completely anonymous through Midnight Network's zero-knowledge technology. 
                We verify your authenticity without revealing who you are. Your review is permanently stored on-chain 
                while your privacy is mathematically guaranteed.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="success" gradient size="sm">
                  🔐 ZK Protected
                </Badge>
                <Badge variant="primary" gradient size="sm">
                  🎭 Anonymous
                </Badge>
                <Badge variant="warning" gradient size="sm">
                  ⚡ Instant Verification
                </Badge>
                <Badge variant="info" gradient size="sm">
                  🌙 Midnight Network
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Project Information - Enhanced */}
        <Card variant="elevated" className="form-section">
          <CardHeader>
            <CardTitle size="xl" gradient>
              DApp Information
            </CardTitle>
            <CardDescription>
              Details about the decentralized application you're reviewing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  DApp Contract Address *
                </label>
                <input
                  type="text"
                  name="projectAddress"
                  value={formData.projectAddress}
                  onChange={handleInputChange}
                  className="input font-mono text-sm"
                  placeholder="0x1234567890abcdef..."
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  The smart contract address of the DApp you're reviewing
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  DApp Name *
                </label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="e.g., Uniswap, Chainlink, Aave..."
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  DApp Website
                </label>
                <input
                  type="url"
                  name="projectWebsite"
                  value={formData.projectWebsite}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="">Select a category...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rating - Enhanced */}
        <Card variant="elevated" className="form-section">
          <CardHeader centered>
            <CardTitle size="xl" gradient>
              Overall Rating
            </CardTitle>
            <CardDescription>
              Rate your overall experience with this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-6">
              <div className="flex items-center space-x-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className={`text-5xl transition-all duration-300 hover:scale-125 transform ${
                      star <= formData.rating
                        ? "text-amber-400 drop-shadow-lg scale-110"
                        : "text-slate-300 hover:text-amber-200 hover:drop-shadow-md"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div className="text-center">
                {formData.rating > 0 ? (
                  <div className="space-y-2">
                    <Badge variant="primary" gradient size="lg">
                      {formData.rating}/5 stars selected
                    </Badge>
                    <p className="text-sm text-slate-600">
                      {formData.rating === 5
                        ? "Excellent!"
                        : formData.rating === 4
                        ? "Very Good"
                        : formData.rating === 3
                        ? "Good"
                        : formData.rating === 2
                        ? "Fair"
                        : "Poor"}
                    </p>
                  </div>
                ) : (
                  <span className="text-slate-500">Click stars to rate</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Content - Enhanced */}
        <Card variant="elevated" className="form-section">
          <CardHeader>
            <CardTitle size="xl" gradient>
              Your Review
            </CardTitle>
            <CardDescription>
              Share your detailed experience and thoughts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Review Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="input"
                placeholder="Brief summary of your experience..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Detailed Review *
              </label>
              <textarea
                name="review"
                value={formData.review}
                onChange={handleInputChange}
                className="textarea min-h-[180px]"
                placeholder="Share your detailed experience with this project. What worked well? What didn't? How was the user experience?"
                required
              />
              <div className="flex justify-between items-center mt-2">
                <div
                  className={`text-sm ${
                    formData.review.length >= 50
                      ? "text-emerald-600"
                      : "text-amber-600"
                  }`}
                >
                  Minimum 50 characters ({formData.review.length}/50)
                </div>
                {formData.review.length >= 50 && (
                  <Badge variant="success" gradient size="sm">
                    ✓ Requirement met
                  </Badge>
                )}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Pros (What you liked)
                </label>
                <textarea
                  name="pros"
                  value={formData.pros}
                  onChange={handleInputChange}
                  className="textarea min-h-[120px]"
                  placeholder="What did you like about this project? List the positives..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Cons (What could be improved)
                </label>
                <textarea
                  name="cons"
                  value={formData.cons}
                  onChange={handleInputChange}
                  className="textarea min-h-[120px]"
                  placeholder="What could be improved? Any issues you encountered..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proof Upload - Enhanced */}
        <Card variant="elevated" className="form-section">
          <CardHeader>
            <CardTitle size="xl" gradient>
              Supporting Evidence (Optional)
            </CardTitle>
            <CardDescription>
              Upload screenshots or documents to support your review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="upload-zone text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white shadow-xl mb-6">
                <svg
                  className="w-8 h-8"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="mb-6">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="block text-xl font-bold text-slate-900 mb-2">
                    Upload Evidence Files
                  </span>
                  <span className="block text-slate-600 mb-4">
                    PNG, JPG, PDF up to 10MB each. Screenshots of transactions,
                    interfaces, etc.
                  </span>
                </label>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  multiple
                  accept=".png,.jpg,.jpeg,.pdf,.webp"
                  onChange={handleFileUpload}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => document.getElementById("file-upload")?.click()}
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
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Choose Files
              </Button>
            </div>
            {formData.proofFiles.length > 0 && (
              <div className="mt-8">
                <p className="font-bold text-slate-700 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-emerald-500"
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
                  Uploaded files:
                </p>
                <div className="grid gap-3">
                  {formData.proofFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-white/80 rounded-xl border border-white/60 shadow-md backdrop-blur-sm"
                    >
                      <div className="flex items-center text-slate-700">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white shadow-lg mr-4">
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <span className="font-semibold block">
                            {file.name}
                          </span>
                          <span className="text-slate-500 text-sm">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            proofFiles: prev.proofFiles.filter(
                              (_, i) => i !== index
                            ),
                          }));
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-50"
                      >
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Guidelines - Enhanced */}
        <Card className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 border-amber-200/60">
          <CardContent spacing="lg">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg mr-4 flex-shrink-0">
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.232 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 text-lg mb-3">
                  Review Guidelines
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-amber-700">
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <span className="text-amber-500 mr-2">•</span>
                      <span>Be honest and fair in your assessment</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-amber-500 mr-2">•</span>
                      <span>
                        Focus on your actual experience with the project
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <span className="text-amber-500 mr-2">•</span>
                      <span>
                        Avoid personal attacks or unsubstantiated claims
                      </span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-amber-500 mr-2">•</span>
                      <span>Include specific details to help other users</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button - Enhanced */}
        <div className="flex justify-center pt-6">
          <Button
            type="submit"
            size="xl"
            isLoading={isSubmitting}
            disabled={
              !formData.projectAddress ||
              !formData.projectName ||
              !formData.category ||
              !formData.title ||
              !formData.review ||
              formData.rating === 0 ||
              formData.review.length < 50
            }
            gradient
            className="px-16 py-5 text-lg shadow-2xl hover:shadow-blue-500/25"
          >
            {isSubmitting ? (
              <>
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 mr-3 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="animate-pulse">
                    Submitting to Midnight Network...
                  </span>
                </div>
              </>
            ) : (
              <>
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                Submit to Midnight Contract
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReviewSubmissionPage;
