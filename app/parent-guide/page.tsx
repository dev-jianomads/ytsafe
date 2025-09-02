import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, Shield, Smartphone, Monitor, AlertTriangle, 
  CheckCircle, ExternalLink, Users, Clock, Eye 
} from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Complete Parent Guide - YouTube Safety & Parental Controls',
  description: 'Comprehensive guide for parents on YouTube safety, parental controls, and protecting children online. Learn how to block channels, set up YouTube Kids, and create safe viewing environments.',
  keywords: [
    'YouTube parental controls',
    'YouTube Kids setup',
    'block YouTube channels',
    'Family Link YouTube',
    'YouTube safety for kids',
    'parent guide YouTube',
    'child safety online',
    'YouTube restricted mode'
  ],
  openGraph: {
    title: 'Complete Parent Guide - YouTube Safety & Parental Controls',
    description: 'Everything parents need to know about YouTube safety, parental controls, and protecting children online.',
    url: 'https://streamsafekids.com/parent-guide',
  },
  alternates: {
    canonical: 'https://streamsafekids.com/parent-guide',
  },
};

export default function ParentGuidePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <Heart className="h-8 w-8 text-pink-500" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Complete Parent Guide</h1>
              <p className="text-gray-600">Everything you need to know about YouTube safety for kids</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              ← Back to Analysis Tool
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Quick Start Guide */}
        <Card className="p-6 border-green-200 bg-green-50">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-green-900">Quick Start: Safer YouTube in 5 Minutes</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-sm font-bold text-green-700">1</span>
              <p className="text-green-800"><strong>Download YouTube Kids</strong> for children under 13 (safest option)</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-sm font-bold text-green-700">2</span>
              <p className="text-green-800"><strong>Set up Family Link</strong> for teens using regular YouTube</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-sm font-bold text-green-700">3</span>
              <p className="text-green-800"><strong>Use StreamSafe Kids</strong> to check channels before allowing access</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-sm font-bold text-green-700">4</span>
              <p className="text-green-800"><strong>Block problematic channels</strong> using the instructions below</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-sm font-bold text-green-700">5</span>
              <p className="text-green-800"><strong>Regular check-ins</strong> about what they're watching</p>
            </div>
          </div>
        </Card>

        {/* How to Block Channels */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-red-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">How to Block YouTube Channels</h2>
          </div>

          <div className="space-y-6">
            {/* YouTube Kids */}
            <div className="p-4 border border-green-200 rounded-lg bg-green-50">
              <div className="flex items-center gap-3 mb-3">
                <Smartphone className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-900">YouTube Kids App</h3>
                <Badge className="bg-green-600 text-white">Recommended for Under 13</Badge>
              </div>
              <div className="space-y-2 text-sm text-green-800">
                <p className="font-medium">Steps to block a channel:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Open the YouTube Kids app</li>
                  <li>Find any video from the channel you want to block</li>
                  <li>Tap the 3-dot menu (⋮) on the video</li>
                  <li>Select "Block this channel"</li>
                  <li>Confirm the action</li>
                </ol>
                <Alert className="mt-3 border-green-300 bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Pro Tip:</strong> You can unblock channels anytime in the app settings under "Blocked content"
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            {/* Family Link */}
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-center gap-3 mb-3">
                <Monitor className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Family Link Supervised YouTube</h3>
                <Badge className="bg-blue-600 text-white">For Teens</Badge>
              </div>
              <div className="space-y-2 text-sm text-blue-800">
                <p className="font-medium">Steps to block a channel:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Go to the channel page on YouTube</li>
                  <li>Click the "About" tab</li>
                  <li>Click the flag icon → "Report user"</li>
                  <li>Select "Block channel for children"</li>
                  <li>Choose which child account to block for</li>
                </ol>
                <p className="text-xs text-blue-700 mt-2">
                  📱 <strong>On mobile:</strong> Channel page → More (3 dots) → Block channel for children
                </p>
              </div>
            </div>

            {/* Restricted Mode Limitation */}
            <div className="p-4 border border-amber-200 rounded-lg bg-amber-50">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-amber-900">Restricted Mode (Limited)</h3>
              </div>
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Restricted Mode on regular YouTube only filters content by maturity signals—you cannot block specific channels. For better control, use YouTube Kids or Family Link supervised accounts.
              </p>
            </div>
          </div>
        </Card>

        {/* Age-Specific Guidance */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Age-Specific Viewing Guidance</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
              <Badge className="bg-green-500 text-white font-bold">E</Badge>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Ages 6 and Under</h3>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Recommended:</strong> YouTube Kids app only, with strict parental supervision
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Always watch together</li>
                  <li>• Use timer controls in YouTube Kids</li>
                  <li>• Turn off search functionality</li>
                  <li>• Curate approved channels only</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-lg">
              <Badge className="bg-emerald-500 text-white font-bold">E10+</Badge>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Ages 7-10</h3>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Recommended:</strong> YouTube Kids or supervised regular YouTube
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Preview new channels before approval</li>
                  <li>• Set viewing time limits</li>
                  <li>• Regular discussions about content</li>
                  <li>• Block channels with concerning themes</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-lg">
              <Badge className="bg-amber-500 text-white font-bold">T</Badge>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Ages 11-15</h3>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Recommended:</strong> Regular YouTube with Family Link parental controls
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Use Family Link for oversight</li>
                  <li>• Discuss content themes and values</li>
                  <li>• Monitor for concerning behavior changes</li>
                  <li>• Teach critical thinking about online content</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg">
              <Badge className="bg-red-500 text-white font-bold">16+</Badge>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Ages 16 and Up</h3>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Recommended:</strong> More independence with open communication
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Maintain open dialogue about content</li>
                  <li>• Discuss media literacy and critical thinking</li>
                  <li>• Be available for questions and concerns</li>
                  <li>• Monitor for signs of problematic content consumption</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Warning Signs */}
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="h-6 w-6 text-red-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-red-900">Warning Signs to Watch For</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Behavioral Changes</h3>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Hiding screen when you approach</li>
                <li>• Sudden mood or behavior changes</li>
                <li>• Using unfamiliar slang or language</li>
                <li>• Nightmares or increased anxiety</li>
                <li>• Requesting expensive items frequently</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-red-900 mb-2">Content Red Flags</h3>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Excessive focus on money/purchases</li>
                <li>• Adult themes in "kid-friendly" content</li>
                <li>• Aggressive or violent behavior modeling</li>
                <li>• Inappropriate language normalization</li>
                <li>• Secretive about viewing habits</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* External Resources */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <ExternalLink className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Official Resources & Support</h2>
          </div>
          
          <div className="space-y-4">
            <a
              href="https://www.esafety.gov.au/parents"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">eSafety Commissioner - Parent Resources</h3>
                  <p className="text-sm text-blue-700">Australia's official online safety authority with comprehensive parent guides</p>
                </div>
              </div>
            </a>

            <a
              href="https://www.esafety.gov.au/parents/issues-and-advice/parental-controls"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Parental Controls Setup Guide</h3>
                  <p className="text-sm text-green-700">Step-by-step instructions for setting up parental controls across all platforms</p>
                </div>
              </div>
            </a>

            <a
              href="https://support.google.com/youtube/answer/2802272"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-purple-900">YouTube Kids Official Help</h3>
                  <p className="text-sm text-purple-700">Google's official documentation for YouTube Kids setup and management</p>
                </div>
              </div>
            </a>

            <a
              href="https://families.google.com/familylink/"
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="font-semibold text-indigo-900">Google Family Link</h3>
                  <p className="text-sm text-indigo-700">Set up supervised accounts and parental controls for teens</p>
                </div>
              </div>
            </a>
          </div>
        </Card>

        {/* Platform Comparison */}
        <Card className="p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Platform Comparison</h2>
          
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-semibold text-gray-900">Feature</th>
                  <th className="text-center py-2 font-semibold text-gray-900">YouTube Kids</th>
                  <th className="text-center py-2 font-semibold text-gray-900">Family Link</th>
                  <th className="text-center py-2 font-semibold text-gray-900">Restricted Mode</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b">
                  <td className="py-2">Block specific channels</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">❌</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Age-based filtering</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Time limits</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">❌</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Search control</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">✅</td>
                  <td className="text-center py-2">❌</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Best for age</td>
                  <td className="text-center py-2">Under 13</td>
                  <td className="text-center py-2">13-17</td>
                  <td className="text-center py-2">Basic filtering</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Emergency Resources */}
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-red-900">If You're Concerned</h2>
          </div>
          <div className="space-y-3 text-red-800">
            <p>
              <strong>If your child has been exposed to harmful content:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
              <li>Stay calm and create a safe space for discussion</li>
              <li>Ask open-ended questions about what they saw</li>
              <li>Reassure them they're not in trouble for telling you</li>
              <li>Report harmful content to YouTube and relevant authorities</li>
              <li>Consider professional support if needed</li>
            </ul>
            
            <div className="mt-4 p-3 bg-white rounded border border-red-200">
              <p className="text-sm text-red-800">
                <strong>Australia:</strong> Contact eSafety Commissioner at{' '}
                <a href="https://www.esafety.gov.au/report" className="underline hover:text-red-900">
                  esafety.gov.au/report
                </a>
              </p>
            </div>
          </div>
        </Card>

        {/* Call to Action */}
        <div className="text-center py-8">
          <Link href="/">
            <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Shield className="h-5 w-5" />
              Start Analyzing Channels
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}