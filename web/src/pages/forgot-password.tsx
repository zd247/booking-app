import { Box, Button, Link } from '@chakra-ui/react'
import { Form, Formik } from 'formik'
import { withUrqlClient } from 'next-urql'
import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { InputField } from '../components/InputField'
import { Wrapper } from '../components/Wrapper'
import { createUrqlClient } from '../utils/createUrqlClient'
import { useForgotPasswordMutation } from '../generated/graphql'
import { toErrorMap } from '../utils/toErrorMap'

interface ForgotPasswordProps {}

const ForgotPassword: React.FC<{}> = ({}) => {
	const [, forgotPassword] = useForgotPasswordMutation()
	const router = useRouter()

	return (
		<Wrapper variant='small'>
			<Box>
				<p>RESET PASSWORD PAGE</p>
			</Box>
			<Box>
				<p>enter a valid email to send the reset password link to</p>
			</Box>
			<hr />
			<br />
			<Formik
				initialValues={{ email: '' }}
				onSubmit={async (values, { setErrors }) => {
					const response = await forgotPassword(values)
					if (response.data?.forgotPassword === false) {
						setErrors({email: "email provided was not valid"})
					} else {
						router.push('/login')
					}
				}}>
				{({ isSubmitting }) => (
					<Form>
						<Box mt={4}>
							<InputField
								name='email'
								placeholder='email'
								label='email'
							/>
						</Box>
						<Button
							mt={4}
							type='submit'
							isLoading={isSubmitting}
							colorScheme='teal'>
							Send
						</Button>
					</Form>
				)}
			</Formik>
		</Wrapper>
	)
}

export default withUrqlClient(createUrqlClient)(ForgotPassword)
