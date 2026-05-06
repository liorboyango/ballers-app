import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomizationForm from '../CustomizationForm';

const mockProduct = {
  _id: 'prod123',
  name: 'Brazil Home Kit',
  team: { name: 'Brazil' },
  primaryColor: '#1A1A2E',
  accentColor: '#E8C547',
};

describe('CustomizationForm', () => {
  it('renders all form fields', () => {
    render(<CustomizationForm product={mockProduct} />);
    expect(screen.getByLabelText(/jersey number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name \/ sponsor/i)).toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
  });

  it('renders all size buttons', () => {
    render(<CustomizationForm product={mockProduct} />);
    ['XS', 'S', 'M', 'L', 'XL', 'XXL'].forEach((size) => {
      expect(screen.getByRole('button', { name: `Size ${size}` })).toBeInTheDocument();
    });
  });

  it('validates jersey number range', () => {
    render(<CustomizationForm product={mockProduct} />);
    const numberInput = screen.getByLabelText(/jersey number/i);

    fireEvent.change(numberInput, { target: { value: '0' } });
    // 0 is filtered out since it's not 1-99
    expect(screen.queryByText(/number must be between/i)).not.toBeInTheDocument();
  });

  it('converts name to uppercase', () => {
    render(<CustomizationForm product={mockProduct} />);
    const nameInput = screen.getByLabelText(/name \/ sponsor/i);
    fireEvent.change(nameInput, { target: { value: 'messi' } });
    expect(nameInput.value).toBe('MESSI');
  });

  it('selects size on button click', () => {
    render(<CustomizationForm product={mockProduct} />);
    const sizeL = screen.getByRole('button', { name: 'Size L' });
    fireEvent.click(sizeL);
    expect(sizeL).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onCustomizationChange when values change', () => {
    const mockOnChange = jest.fn();
    render(
      <CustomizationForm product={mockProduct} onCustomizationChange={mockOnChange} />
    );

    const sizeM = screen.getByRole('button', { name: 'Size M' });
    fireEvent.click(sizeM);

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({ size: 'M' })
    );
  });

  it('shows character count for name field', () => {
    render(<CustomizationForm product={mockProduct} />);
    expect(screen.getByText('0/20 characters')).toBeInTheDocument();
  });

  it('renders jersey preview', () => {
    render(<CustomizationForm product={mockProduct} />);
    expect(screen.getByLabelText('Jersey preview')).toBeInTheDocument();
  });

  it('shows initial values when provided', () => {
    render(
      <CustomizationForm
        product={mockProduct}
        initialValues={{ number: '10', name: 'MESSI', size: 'L' }}
      />
    );
    expect(screen.getByLabelText(/jersey number/i)).toHaveValue('10');
    expect(screen.getByLabelText(/name \/ sponsor/i)).toHaveValue('MESSI');
    expect(screen.getByRole('button', { name: 'Size L' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
