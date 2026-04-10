import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">About GridShift</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground leading-relaxed">
          GridShift helps you see when wholesale electricity is cheap or expensive on ERCOT so you can shift flexible
          loads—EV charging, pool pumps, dishwashers—away from peak hours.
        </p>
        <p className="text-muted-foreground leading-relaxed text-sm">
          Data comes from ERCOT&apos;s public real-time settlement point prices, updated about every fifteen minutes.
          GridShift is informational only; it is not financial or energy advice. Always confirm rates and plans with your
          retail electric provider.
        </p>
        <p>
          <Link to="/" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Back to dashboard
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
