'use client';

import { useFormatter, useLocale } from 'next-intl';
import { forwardRef, useCallback, useEffect, useState } from 'react';

import { Input } from '~/components/ui/input';

interface FormattedNumberInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'onChange' | 'value'
  > {
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * Number input that displays formatted numbers according to user's locale
 * While focused: shows raw input for easy editing
 * While blurred: shows formatted number with locale-specific separators
 */
export const FormattedNumberInput = forwardRef<
  HTMLInputElement,
  FormattedNumberInputProps
>(({ value = '', onChange, onBlur, ...props }, ref) => {
  const format = useFormatter();
  const locale = useLocale();
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Format clean numeric value for display
  const formatForDisplay = useCallback(
    (input: string): string => {
      if (!input) return '';

      // Parse the clean value (expecting period as decimal separator)
      const numericValue = parseFloat(input);
      if (isNaN(numericValue)) return input;

      // Format with locale-specific separators
      return format.number(numericValue, {
        maximumFractionDigits: 2,
        useGrouping: true,
      });
    },
    [format],
  );

  // Update display value when prop value changes (and not focused)
  useEffect(() => {
    if (!isFocused) {
      const formatted = value ? formatForDisplay(value) : '';
      setDisplayValue(formatted);
    } else {
      // When focused, show the raw value
      setDisplayValue(value);
    }
  }, [value, isFocused, formatForDisplay]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // While focused, just pass through the raw input
    // Don't try to parse or format it
    setDisplayValue(inputValue);

    // Parse to clean format for validation
    // Replace any locale-specific decimal separators with period
    let cleaned = inputValue;

    // Get the locale's decimal separator
    const parts = new Intl.NumberFormat(locale, {
      useGrouping: false,
    }).formatToParts(1.1);
    const localeDecimal = parts.find((p) => p.type === 'decimal')?.value || '.';

    // Replace locale decimal with period
    if (localeDecimal !== '.') {
      cleaned = cleaned.replace(new RegExp(`\\${localeDecimal}`, 'g'), '.');
    }

    // Remove any characters except digits, period, and minus
    cleaned = cleaned.replace(/[^\d.-]/g, '');

    // Propagate clean value to parent (for validation)
    onChange?.(cleaned);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Show raw unformatted value when focused for easier editing
    setDisplayValue(value);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    // Format the value when losing focus
    const formatted = value ? formatForDisplay(value) : '';
    setDisplayValue(formatted);
    onBlur?.(e);
  };

  return (
    <Input
      {...props}
      ref={ref}
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
});

FormattedNumberInput.displayName = 'FormattedNumberInput';

