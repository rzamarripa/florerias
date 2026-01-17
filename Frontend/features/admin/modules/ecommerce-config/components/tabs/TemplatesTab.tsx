import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TemplatesTabProps {
  selectedTemplate: 'classic' | 'modern' | 'minimalist' | 'elegant';
  setSelectedTemplate: (template: 'classic' | 'modern' | 'minimalist' | 'elegant') => void;
  saving: boolean;
  onSave: () => void;
}

const TemplatesTab: React.FC<TemplatesTabProps> = ({
  selectedTemplate,
  setSelectedTemplate,
  saving,
  onSave,
}) => {
  const templates: Array<{ key: 'classic' | 'modern' | 'minimalist' | 'elegant'; name: string }> = [
    { key: 'classic', name: 'Clasica' },
    { key: 'modern', name: 'Moderna' },
    { key: 'minimalist', name: 'Minimalista' },
    { key: 'elegant', name: 'Elegante' }
  ];

  return (
    <div>
      <h5 className="mb-4 text-lg font-semibold">Selecciona una plantilla</h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {templates.map((template) => (
          <Card
            key={template.key}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate === template.key ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedTemplate(template.key)}
          >
            <CardContent className="text-center p-3">
              <div className="bg-muted rounded-lg mb-3 h-[150px] flex items-center justify-center">
                <span className="text-muted-foreground">{template.name}</span>
              </div>
              <h6 className="font-semibold mb-1">{template.name}</h6>
              {selectedTemplate === template.key && (
                <Badge>Seleccionada</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-end mt-4">
        <Button
          onClick={onSave}
          disabled={saving}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
};

export default TemplatesTab;
