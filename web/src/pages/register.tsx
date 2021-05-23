import React from 'react'
import { Formik, Form } from 'formik'
import {
	FormControl,
	FormLabel,
	Input,
	FormErrorMessage,
	Box,
	Button,
} from '@chakra-ui/react'
import { Wrapper } from '../components/Wrapper'
import { InputField } from '../components/InputField'
import { useMutation } from 'urql'

interface registerProps {}

// Graphql mutation
const REGISTER_MUT = `mutation Register($username: String!, $password:String!){
  register(options:{username: $username, password:$password}){
    errors{
      field,
      message
    },
    user {
      _id,
      username,
      password
    }
  }
}`

const Register: React.FC<registerProps> = ({}) => {
	const [, register] = useMutation(REGISTER_MUT)

	return (
		<Wrapper variant='regular'>
			<Formik
				initialValues={{ username: '', password: '' }}
				onSubmit={values => {
					return register({
						username: values.username,
						password: values.password,
					})
				}}>
				{({ isSubmitting }) => (
					<Form>
						<InputField
							name='username'
							placeholder='username'
							label='Username'
						/>
						<Box mt={4}>
							<InputField
								name='password'
								placeholder='password'
								label='Password'
								type='password'
							/>
						</Box>
						<Button
							mt={4}
							type='submit'
							isLoading={isSubmitting}
							colorScheme='teal'>
							Register
						</Button>
					</Form>
				)}
			</Formik>
		</Wrapper>
	)
}

export default Register
