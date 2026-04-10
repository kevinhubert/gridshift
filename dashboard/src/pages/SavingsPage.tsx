import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SavingsPage() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">Savings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-muted-foreground">
        <p className="leading-relaxed">
          Personalized savings based on your devices and schedule will show here. For now, use the dashboard to see
          today&apos;s price curve and the best times to run flexible loads.
        </p>
        <p>
          <Link
            to="/"
            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Open dashboard
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
