
import React from 'react';
import { CustomQuestion, CustomQuestionType } from '@/utils/qrCode/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';

interface CustomQuestionInputProps {
  question: CustomQuestion;
  value: string;
  onChange: (value: string) => void;
}

const CustomQuestionInput: React.FC<CustomQuestionInputProps> = ({ 
  question, 
  value,
  onChange
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleRadioChange = (value: string) => {
    onChange(value);
  };

  switch (question.type) {
    case CustomQuestionType.TEXT:
      return (
        <div className="space-y-2">
          <Label htmlFor={`question-${question.id}`}>
            {question.questionText}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Textarea
            id={`question-${question.id}`}
            value={value}
            onChange={handleInputChange}
            placeholder="Type your answer..."
            rows={3}
            required={question.required}
          />
        </div>
      );

    case CustomQuestionType.MULTIPLE_CHOICE:
      return (
        <div className="space-y-2">
          <Label>
            {question.questionText}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <RadioGroup value={value} onValueChange={handleRadioChange} required={question.required}>
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${question.id}-${index}`} />
                <Label htmlFor={`option-${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case CustomQuestionType.YES_NO:
      return (
        <div className="space-y-2">
          <Label>
            {question.questionText}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <div className="flex gap-4">
            <Button 
              type="button"
              variant={value === 'Yes' ? 'default' : 'outline'}
              onClick={() => onChange('Yes')}
              className={`flex-1 ${value === 'Yes' ? 'bg-feedback-blue' : ''}`}
            >
              Yes
            </Button>
            <Button 
              type="button"
              variant={value === 'No' ? 'default' : 'outline'}
              onClick={() => onChange('No')}
              className={`flex-1 ${value === 'No' ? 'bg-feedback-blue' : ''}`}
            >
              No
            </Button>
          </div>
        </div>
      );

    case CustomQuestionType.RATING:
      return (
        <div className="space-y-2">
          <Label>
            {question.questionText}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4, 5].map((num) => (
              <Button
                key={num}
                type="button"
                variant={value === num.toString() ? "default" : "outline"}
                className={`h-12 w-12 text-xl ${value === num.toString() ? 'bg-feedback-blue' : ''}`}
                onClick={() => onChange(num.toString())}
              >
                {num}
              </Button>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default CustomQuestionInput;
