import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CategoryKey } from '@/types';

interface CategoryTableProps {
  scores: Record<CategoryKey, number>;
}

export function CategoryTable({ scores }: CategoryTableProps) {
  const categoryLabels: Record<CategoryKey, string> = {
    violence: "Violence",
    language: "Language",
    sexual_content: "Sexual Content",
    substances: "Substances",
    sensitive_topics: "Sensitive Topics",
    commercial_pressure: "Commercial Pressure"
  };

  const getScoreColor = (score: number) => {
    if (score <= 1) return 'bg-green-100 text-green-800 border-green-200';
    if (score <= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (score <= 3) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score <= 0.5) return 'None';
    if (score <= 1.5) return 'Mild';
    if (score <= 2.5) return 'Moderate';
    if (score <= 3.5) return 'Strong';
    return 'Extreme';
  };

  return (
    <Card className="p-4 sm:p-6 mb-6">
      <h3 className="text-base sm:text-lg font-semibold mb-4">Content Categories</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {(Object.entries(scores) as [CategoryKey, number][]).map(([category, score]) => (
          <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg min-w-0">
            <span className="font-medium text-gray-700 text-sm sm:text-base truncate mr-2">
              {categoryLabels[category]}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs sm:text-sm font-mono text-gray-600">
                {score.toFixed(1)}/4
              </span>
              <Badge 
                variant="outline" 
                className={`text-xs whitespace-nowrap ${getScoreColor(score)}`}
              >
                {getScoreLabel(score)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}