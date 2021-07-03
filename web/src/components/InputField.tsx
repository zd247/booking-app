import { FormControl, FormLabel, Input, FormErrorMessage, Textarea } from '@chakra-ui/react';
import { useField } from 'formik';
import React, { InputHTMLAttributes } from 'react'

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string,
  name: string,
  textarea?: boolean,
}

export const InputField: React.FC<InputFieldProps> = ({size: _,...props}) => {
  const [field, {error}] = useField(props)
  
  return (
    <FormControl isInvalid={!!error}>
      <FormLabel htmlFor={field.name}>{props.label}</FormLabel>
      {props.textarea? (
        <Textarea {...field} {...props} id={field.name}/>
      ): (
        <Input {...field} {...props} id={field.name} />
      )}
      {error? <FormErrorMessage>{error}</FormErrorMessage>: null}
    </FormControl>
  );
}