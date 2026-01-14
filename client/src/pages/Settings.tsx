import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { Settings as SettingsIcon, Save } from "lucide-react";

export default function Settings() {
  const { data: idConfigs, isLoading } = trpc.idConfig.list.useQuery();
  const updateConfig = trpc.idConfig.update.useMutation();
  const utils = trpc.useUtils();

  const [editingConfigs, setEditingConfigs] = useState<Record<string, { prefix: string; startNumber: number }>>({});

  const handleSave = async (entityType: string) => {
    const config = editingConfigs[entityType];
    if (!config) return;

    try {
      await updateConfig.mutateAsync({
        entityType,
        prefix: config.prefix,
        startNumber: config.startNumber,
      });
      
      await utils.idConfig.list.invalidate();
      toast.success(`تم تحديث إعدادات ${entityType} بنجاح`);
      
      // Clear editing state
      setEditingConfigs(prev => {
        const newState = { ...prev };
        delete newState[entityType];
        return newState;
      });
    } catch (error) {
      toast.error("فشل في تحديث الإعدادات");
    }
  };

  const getEditingConfig = (entityType: string, currentConfig: any) => {
    return editingConfigs[entityType] || {
      prefix: currentConfig.prefix,
      startNumber: currentConfig.currentNumber + 1,
    };
  };

  const updateEditingConfig = (entityType: string, field: string, value: string | number) => {
    setEditingConfigs(prev => ({
      ...prev,
      [entityType]: {
        ...getEditingConfig(entityType, idConfigs?.find(c => c.entityType === entityType)),
        [field]: value,
      },
    }));
  };

  const getNextIdPreview = (config: any) => {
    const editingConfig = getEditingConfig(config.entityType, config);
    const nextNumber = config.currentNumber + 1;
    return `${editingConfig.prefix}${String(nextNumber).padStart(4, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">الإعدادات</h1>
        </div>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">الإعدادات</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        قم بتخصيص تنسيق المعرفات (IDs) لجميع الكيانات في النظام
      </p>

      <div className="grid gap-6">
        {idConfigs?.map((config) => {
          const editing = getEditingConfig(config.entityType, config);
          const hasChanges = editingConfigs[config.entityType] !== undefined;

          return (
            <Card key={config.id}>
              <CardHeader>
                <CardTitle>{config.entityType}</CardTitle>
                <CardDescription>
                  المعرف التالي: <span className="font-mono font-bold text-primary">{getNextIdPreview(config)}</span>
                  {' '} | التسلسل الحالي: <span className="font-mono">{config.currentNumber}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`prefix-${config.id}`}>البادئة (Prefix)</Label>
                    <Input
                      id={`prefix-${config.id}`}
                      value={editing.prefix}
                      onChange={(e) => updateEditingConfig(config.entityType, 'prefix', e.target.value)}
                      placeholder="Q-"
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1">مثال: Q-, REQ-, TASK-</p>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor={`start-${config.id}`}>إعادة تعيين التسلسل إلى</Label>
                    <Input
                      id={`start-${config.id}`}
                      type="number"
                      value={editing.startNumber}
                      onChange={(e) => updateEditingConfig(config.entityType, 'startNumber', parseInt(e.target.value) || 1)}
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">المعرف التالي سيبدأ من هذا الرقم</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end">
                  {hasChanges && (
                    <Button onClick={() => handleSave(config.entityType)} disabled={updateConfig.isPending}>
                      <Save className="w-4 h-4 mr-2" />
                      حفظ التغييرات
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
