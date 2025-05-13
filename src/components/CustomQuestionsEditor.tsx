
import React, { useState } from 'react';
import { CustomQuestion, CustomQuestionType } from '@/utils/qrCode/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CustomQuestionsEditorProps {
  questions: CustomQuestion[];
  onChange: (questions: CustomQuestion[]) => void;
}

const CustomQuestionsEditor: React.FC<CustomQuestionsEditorProps> = ({ questions, onChange }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const addQuestion = () => {
    const newQuestion: CustomQuestion = {
      id: uuidv4(),
      questionText: '',
      required: false,
      type: CustomQuestionType.TEXT
    };
    onChange([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<CustomQuestion>) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates };
    onChange(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    onChange(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex];
    if (!question.options) {
      question.options = [];
    }
    question.options.push('');
    updateQuestion(questionIndex, { options: [...question.options] });
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = questions[questionIndex];
    if (question.options) {
      question.options[optionIndex] = value;
      updateQuestion(questionIndex, { options: [...question.options] });
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    if (question.options) {
      question.options.splice(optionIndex, 1);
      updateQuestion(questionIndex, { options: [...question.options] });
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newQuestions = [...questions];
    const draggedItem = newQuestions[draggedIndex];
    newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(index, 0, draggedItem);

    onChange(newQuestions);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Custom Questions</h3>
        <Button onClick={addQuestion} size="sm" className="flex gap-1 items-center">
          <Plus className="h-4 w-4" /> Add Question
        </Button>
      </div>

      <div className="space-y-4">
        {questions.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            No custom questions added. Click "Add Question" to create one.
          </p>
        )}

        {questions.map((question, index) => (
          <Card
            key={question.id}
            className="relative border border-gray-200"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className="absolute left-2 top-4 cursor-move text-gray-400 hover:text-gray-600">
              <GripVertical className="h-5 w-5" />
            </div>
            
            <CardContent className="p-4 pl-10">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 mr-4">
                    <Label htmlFor={`question-${index}`}>Question</Label>
                    <Input
                      id={`question-${index}`}
                      value={question.questionText}
                      onChange={(e) => updateQuestion(index, { questionText: e.target.value })}
                      placeholder="Enter your question"
                    />
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(index)}
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`question-type-${index}`}>Question Type</Label>
                    <Select
                      value={question.type}
                      onValueChange={(value) => updateQuestion(index, { 
                        type: value as CustomQuestionType,
                        options: value === CustomQuestionType.MULTIPLE_CHOICE ? [''] : undefined 
                      })}
                    >
                      <SelectTrigger id={`question-type-${index}`}>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={CustomQuestionType.TEXT}>Short Answer</SelectItem>
                        <SelectItem value={CustomQuestionType.MULTIPLE_CHOICE}>Multiple Choice</SelectItem>
                        <SelectItem value={CustomQuestionType.YES_NO}>Yes/No</SelectItem>
                        <SelectItem value={CustomQuestionType.RATING}>Rating (1-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-2 pt-7">
                    <Label htmlFor={`required-${index}`}>Required</Label>
                    <Switch
                      id={`required-${index}`}
                      checked={question.required}
                      onCheckedChange={(checked) => updateQuestion(index, { required: checked })}
                    />
                  </div>
                </div>
                
                {/* Options for multiple choice questions */}
                {question.type === CustomQuestionType.MULTIPLE_CHOICE && question.options && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index, optionIndex)}
                          disabled={question.options?.length === 1}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(index)}
                      className="w-full mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Option
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CustomQuestionsEditor;
