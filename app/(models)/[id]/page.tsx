import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, ExternalLink } from 'lucide-react';
import { allModels } from '@/lib/ai/all-models';

interface ModelPageProps {
  params: {
    id: string;
  };
}

export default function ModelPage({ params }: ModelPageProps) {
  const model = allModels.find((m) => m.id === params.id);

  if (!model) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            {model.owned_by}: {model.name}
          </h1>
          <p className="text-muted-foreground">{model.description}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Model Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Provider</span>
                <Badge variant="outline">{model.owned_by}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Context Length
                </span>
                <span className="text-sm font-medium">
                  {model.context_window.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Input Tokens
                </span>
                <span className="text-sm font-medium">
                  $
                  {(Number.parseFloat(model.pricing.input) * 1_000_000).toFixed(
                    2,
                  )}
                  /M
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Output Tokens
                </span>
                <span className="text-sm font-medium">
                  $
                  {(
                    Number.parseFloat(model.pricing.output) * 1_000_000
                  ).toFixed(2)}
                  /M
                </span>
              </div>
              {/* images pricing not in unified schema */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Tools Support
                </span>
                {model.features.toolCall ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reasoning</span>
                {model.features.reasoning ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modalities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Input</span>
                <div className="flex gap-1">
                  {[
                    model.features?.input?.text ? 'text' : null,
                    model.features?.input?.image ? 'image' : null,
                    model.features?.input?.pdf ? 'pdf' : null,
                    model.features?.input?.audio ? 'audio' : null,
                  ]
                    .filter(Boolean)
                    .map((modality) => (
                      <Badge
                        key={modality as string}
                        variant="outline"
                        className="text-xs"
                      >
                        {modality}
                      </Badge>
                    ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Output</span>
                <div className="flex gap-1">
                  {[
                    model.features?.output?.text ? 'text' : null,
                    model.features?.output?.image ? 'image' : null,
                    model.features?.output?.audio ? 'audio' : null,
                  ]
                    .filter(Boolean)
                    .map((modality) => (
                      <Badge
                        key={modality as string}
                        variant="outline"
                        className="text-xs"
                      >
                        {modality}
                      </Badge>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4">
          <Button asChild>
            <a href={`/compare?models=${model.id}`}>
              <span>Compare with other models</span>
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button variant="outline">Try in Chat</Button>
        </div>
      </div>
    </div>
  );
}
