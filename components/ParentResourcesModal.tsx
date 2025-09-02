'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, Shield, ExternalLink, Smartphone, Monitor, 
  AlertTriangle, CheckCircle, Info, BookOpen 
} from 'lucide-react';

interface ParentResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName?: string;
  ageBand: string;
}

export function ParentResourcesModal({ isOpen, onClose, channelName, ageBand }: ParentResourcesModalProps) {
  if (!isOpen) return null;

  const isHighRisk = ageBand === '16+' || ageBand === 'T';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] bg-white relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Parent Resources</h2>
              <p className="text-sm text-gray-600">Tools and guidance for safe YouTube viewing</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="blocking" className="p-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="blocking">Block Channels</TabsTrigger>
              <TabsTrigger value="controls">Parental Controls</TabsTrigger>
              <TabsTrigger value="tips">Safe Viewing</TabsTrigger>
            </TabsList>

            {/* Channel Blocking Tab */}
            <TabsContent value="blocking" className="space-y-6 mt-6">
              {channelName && isHighRisk && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-red-900">High Risk Content Detected</h3>
                  </div>
                  <p className="text-sm text-red-800 mb-3">
                    Based on our analysis, <strong>{channelName}</strong> contains content that may not be suitable for younger viewers. Consider blocking this channel.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">How to Block YouTube Channels</h3>
                
                {/* YouTube Kids */}
                <Card className="p-4 border-green-200 bg-green-50">
                  <div className="flex items-center gap-3 mb-3">
                    <Smartphone className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">YouTube Kids App (Easiest)</h4>
                    <Badge className="bg-green-600 text-white">Recommended</Badge>
                  </div>
                  <div className="space-y-2 text-sm text-green-800">
                    <p className="font-medium">Steps to block:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Open the YouTube Kids app</li>
                      <li>Find any video from the channel you want to block</li>
                      <li>Tap the 3-dot menu on the video</li>
                      <li>Select "Block this channel"</li>
                      <li>Confirm the action</li>
                    </ol>
                    <p className="text-xs text-green-700 mt-2">
                      ✅ You can unblock channels anytime in the app settings under "Blocked content"
                    </p>
                  </div>
                </Card>

                {/* Family Link Supervised */}
                <Card className="p-4 border-blue-200 bg-blue-50">
                  <div className="flex items-center gap-3 mb-3">
                    <Monitor className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Family Link Supervised YouTube</h4>
                  </div>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p className="font-medium">Steps to block:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Go to the channel page on YouTube</li>
                      <li>Click "About" tab</li>
                      <li>Click the flag icon → "Report user"</li>
                      <li>Select "Block channel for children"</li>
                      <li>Choose which child account to block for</li>
                    </ol>
                    <p className="text-xs text-blue-700 mt-2">
                      📱 On mobile: Channel page → More (3 dots) → Block channel for children
                    </p>
                  </div>
                </Card>

                {/* Restricted Mode Limitation */}
                <Card className="p-4 border-amber-200 bg-amber-50">
                  <div className="flex items-center gap-3 mb-3">
                    <Info className="h-5 w-5 text-amber-600" />
                    <h4 className="font-semibold text-amber-900">Restricted Mode (Limited)</h4>
                  </div>
                  <p className="text-sm text-amber-800">
                    Restricted Mode on regular YouTube only filters by maturity signals—you cannot block specific channels. 
                    For better control, use YouTube Kids or Family Link supervised accounts.
                  </p>
                </Card>
              </div>
            </TabsContent>

            {/* Parental Controls Tab */}
            <TabsContent value="controls" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Comprehensive Parental Controls</h3>
                
                <Card className="p-4 border-blue-200 bg-blue-50">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">eSafety Commissioner (Australia)</h4>
                  </div>
                  <p className="text-sm text-blue-800 mb-3">
                    Australia's official online safety authority provides comprehensive guides for parents.
                  </p>
                  <div className="space-y-2">
                    <a
                      href="https://www.esafety.gov.au/parents"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      General Parent Resources
                    </a>
                    <br />
                    <a
                      href="https://www.esafety.gov.au/parents/issues-and-advice/parental-controls"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Parental Controls Setup Guide
                    </a>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Platform-Specific Controls</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-800">YouTube Kids</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Age-based content filtering</li>
                        <li>• Timer controls</li>
                        <li>• Block videos/channels</li>
                        <li>• Search on/off toggle</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-800">Family Link</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Supervised YouTube access</li>
                        <li>• Time limits</li>
                        <li>• App approval required</li>
                        <li>• Location tracking</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Safe Viewing Tips Tab */}
            <TabsContent value="tips" className="space-y-6 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Safe Viewing Tips</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 border-green-200 bg-green-50">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-900">Best Practices</h4>
                    </div>
                    <ul className="text-sm text-green-800 space-y-2">
                      <li>• Watch together when possible</li>
                      <li>• Preview new channels first</li>
                      <li>• Set clear viewing rules</li>
                      <li>• Use age-appropriate apps</li>
                      <li>• Regular check-ins about content</li>
                    </ul>
                  </Card>

                  <Card className="p-4 border-amber-200 bg-amber-50">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <h4 className="font-semibold text-amber-900">Warning Signs</h4>
                    </div>
                    <ul className="text-sm text-amber-800 space-y-2">
                      <li>• Child hides screen when you approach</li>
                      <li>• Sudden behavior changes</li>
                      <li>• Using unfamiliar slang/language</li>
                      <li>• Requesting expensive items</li>
                      <li>• Nightmares or anxiety</li>
                    </ul>
                  </Card>
                </div>

                <Card className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Age-Specific Guidance</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge className="bg-green-500 text-white">E</Badge>
                      <div>
                        <p className="font-medium text-gray-800">Ages 6 and under</p>
                        <p className="text-sm text-gray-600">Always supervise. Use YouTube Kids with strict settings.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="bg-emerald-500 text-white">E10+</Badge>
                      <div>
                        <p className="font-medium text-gray-800">Ages 7-10</p>
                        <p className="text-sm text-gray-600">YouTube Kids or supervised regular YouTube. Preview new content.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="bg-amber-500 text-white">T</Badge>
                      <div>
                        <p className="font-medium text-gray-800">Ages 11-15</p>
                        <p className="text-sm text-gray-600">Regular YouTube with parental controls. Discuss content together.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge className="bg-red-500 text-white">16+</Badge>
                      <div>
                        <p className="font-medium text-gray-800">Ages 16+</p>
                        <p className="text-sm text-gray-600">More independence, but maintain open communication about content.</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}