'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Database, Key, Globe } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: string;
}

export default function TestSupabasePage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    const testResults: TestResult[] = [];
    
    // Test 1: Environment Variables
    testResults.push({
      name: 'Environment Variables',
      status: 'pending',
      message: 'Checking environment variables...'
    });
    setResults([...testResults]);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (hasUrl && hasAnonKey) {
      testResults[0] = {
        name: 'Environment Variables',
        status: 'success',
        message: 'Environment variables found',
        details: `URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...\nAnon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`
      };
    } else {
      testResults[0] = {
        name: 'Environment Variables',
        status: 'error',
        message: 'Missing environment variables',
        details: `URL: ${hasUrl ? '✓' : '✗'}\nAnon Key: ${hasAnonKey ? '✓' : '✗'}`
      };
    }
    setResults([...testResults]);
    
    if (!hasUrl || !hasAnonKey) {
      setIsRunning(false);
      return;
    }
    
    // Test 2: Basic Connection
    testResults.push({
      name: 'Basic Connection',
      status: 'pending',
      message: 'Testing basic connection...'
    });
    setResults([...testResults]);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const response = await fetch('/api/test-supabase-connection');
      const data = await response.json();
      
      if (response.ok && data.success) {
        testResults[1] = {
          name: 'Basic Connection',
          status: 'success',
          message: 'Successfully connected to Supabase',
          details: data.details
        };
      } else {
        testResults[1] = {
          name: 'Basic Connection',
          status: 'error',
          message: data.error || 'Connection failed',
          details: data.details
        };
      }
    } catch (error) {
      testResults[1] = {
        name: 'Basic Connection',
        status: 'error',
        message: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    setResults([...testResults]);
    
    // Test 3: Table Access
    testResults.push({
      name: 'Table Access',
      status: 'pending',
      message: 'Testing table access...'
    });
    setResults([...testResults]);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const response = await fetch('/api/test-supabase-tables');
      const data = await response.json();
      
      if (response.ok && data.success) {
        testResults[2] = {
          name: 'Table Access',
          status: 'success',
          message: 'Successfully accessed tables',
          details: data.details
        };
      } else {
        testResults[2] = {
          name: 'Table Access',
          status: 'error',
          message: data.error || 'Table access failed',
          details: data.details
        };
      }
    } catch (error) {
      testResults[2] = {
        name: 'Table Access',
        status: 'error',
        message: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    setResults([...testResults]);
    
    // Test 4: Data Query
    testResults.push({
      name: 'Data Query',
      status: 'pending',
      message: 'Testing data queries...'
    });
    setResults([...testResults]);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const response = await fetch('/api/test-supabase-query');
      const data = await response.json();
      
      if (response.ok && data.success) {
        testResults[3] = {
          name: 'Data Query',
          status: 'success',
          message: 'Successfully queried data',
          details: data.details
        };
      } else {
        testResults[3] = {
          name: 'Data Query',
          status: data.warning ? 'warning' : 'error',
          message: data.error || data.message || 'Query failed',
          details: data.details
        };
      }
    } catch (error) {
      testResults[3] = {
        name: 'Data Query',
        status: 'error',
        message: 'Network error',
        details: error instanceof Error ? error.message : 'Unknown error'
      };
    }
    setResults([...testResults]);
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      default: return <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Database className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Supabase Connection Test</h1>
            <p className="text-gray-600">Test your Supabase database connection and configuration</p>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Connection Tests</h2>
            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="gap-2"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Run Tests
                </>
              )}
            </Button>
          </div>

          {results.length === 0 && !isRunning && (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Click "Run Tests" to check your Supabase connection</p>
            </div>
          )}

          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}>
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(result.status)}
                  <h3 className="font-semibold text-gray-900">{result.name}</h3>
                  <Badge variant="outline" className="ml-auto">
                    {result.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mb-2">{result.message}</p>
                {result.details && (
                  <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-x-auto">
                    {result.details}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Key className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Environment Setup</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <p>If tests are failing, make sure you have these environment variables set:</p>
            <div className="bg-gray-50 p-3 rounded border font-mono text-xs">
              <div>NEXT_PUBLIC_SUPABASE_URL=your_supabase_url</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key</div>
              <div>SUPABASE_SERVICE_ROLE_KEY=your_service_role_key</div>
            </div>
            <p className="text-xs text-gray-500">
              You can find these values in your Supabase project dashboard under Settings → API
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}