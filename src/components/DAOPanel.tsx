
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Vote, Clock, CheckCircle, XCircle } from 'lucide-react';

const DAOPanel = () => {
  const [userVotes, setUserVotes] = useState<{[key: number]: 'approve' | 'reject' | null}>({});

  const proposals = [
    {
      id: 1,
      title: 'Report: Malicious NFT Minting Contract',
      contract: '0xBADC0DE1234567890ABCDEF1234567890ABCDEF1',
      category: 'NFT Mint Scam',
      description: 'Contract drains wallet balance when minting "free" NFTs',
      votesApprove: 847,
      votesReject: 23,
      totalStaked: '12,450 SHIELD',
      timeLeft: '2 days',
      status: 'active',
      reporter: '0x742d35Cc...098d6'
    },
    {
      id: 2,
      title: 'Report: Honeypot Token Contract',
      contract: '0xDEADBEEF0123456789ABCDEF0123456789ABCDEF',
      category: 'Honeypot',
      description: 'Token allows buying but prevents selling through hidden restrictions',
      votesApprove: 1205,
      votesReject: 45,
      totalStaked: '18,720 SHIELD',
      timeLeft: '5 hours',
      status: 'active',
      reporter: '0x1f9840a8...01F984'
    },
    {
      id: 3,
      title: 'Report: Approval Drainer',
      contract: '0xSCAM1234567890ABCDEF1234567890ABCDEF1234',
      category: 'Approval Drainer',
      description: 'Requests unlimited token approvals and drains user funds',
      votesApprove: 2156,
      votesReject: 12,
      totalStaked: '25,890 SHIELD',
      timeLeft: 'Completed',
      status: 'approved',
      reporter: '0xABC123...DEF456'
    }
  ];

  const handleVote = (proposalId: number, vote: 'approve' | 'reject') => {
    setUserVotes(prev => ({ ...prev, [proposalId]: vote }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'approved': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'rejected': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'NFT Mint Scam': return 'bg-purple-500/20 text-purple-400';
      case 'Honeypot': return 'bg-yellow-500/20 text-yellow-400';
      case 'Approval Drainer': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 backdrop-blur-lg border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Users className="h-5 w-5 text-cyan-400" />
            <span>DAO Governance Panel</span>
          </CardTitle>
          <p className="text-gray-400">Vote on community-reported threats using your SHIELD tokens</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-white">1,247</div>
              <div className="text-sm text-gray-400">Your SHIELD Balance</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-white">23</div>
              <div className="text-sm text-gray-400">Votes Cast</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-2xl font-bold text-white">89%</div>
              <div className="text-sm text-gray-400">Accuracy Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proposals */}
      <div className="space-y-4">
        {proposals.map((proposal) => (
          <Card key={proposal.id} className="bg-black/20 backdrop-blur-lg border-white/10">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-white">{proposal.title}</h3>
                    <Badge className={getStatusColor(proposal.status)}>
                      {proposal.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getCategoryColor(proposal.category)}>
                      {proposal.category}
                    </Badge>
                    <span className="text-sm text-gray-400">
                      Reported by {proposal.reporter}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-gray-400 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{proposal.timeLeft}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Contract Address:</div>
                  <div className="font-mono text-sm text-white bg-white/5 p-2 rounded border border-white/10">
                    {proposal.contract}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-400 mb-1">Description:</div>
                  <p className="text-white">{proposal.description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-white">{proposal.votesApprove} Approve</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-white">{proposal.votesReject} Reject</span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Total Staked: {proposal.totalStaked}
                    </div>
                  </div>

                  {proposal.status === 'active' && (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleVote(proposal.id, 'approve')}
                        className={`${
                          userVotes[proposal.id] === 'approve'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-green-600/20 hover:bg-green-600/30 border border-green-500/30'
                        }`}
                      >
                        <Vote className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleVote(proposal.id, 'reject')}
                        className={`${
                          userVotes[proposal.id] === 'reject'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-red-600/20 hover:bg-red-600/30 border border-red-500/30'
                        }`}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DAOPanel;
