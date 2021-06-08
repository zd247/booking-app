import React from 'react'
import { Formik, Form } from 'formik'
import {
    Box,
    Button,
} from '@chakra-ui/react'
import { Wrapper } from '../components/Wrapper'
import { InputField } from '../components/InputField'
import {useLoginMutation} from '../generated/graphql'
import { toErrorMap } from '../utils/toErrorMap'
import {useRouter} from 'next/router'
import { createUrqlClient } from '../utils/createUrqlClient'
import { withUrqlClient } from 'next-urql';

interface loginProps {}

const Login: React.FC<loginProps> = ({}) => {
    const router = useRouter();
    const [, login] = useLoginMutation()

    return (
        <Wrapper variant='small'>
            <Box>
                <p>Login Page</p>
            </Box>
            <hr/>
            <br/>
            <Formik
                initialValues={{ usernameOrEmail: '', password: '' }}
                onSubmit={async (values, {setErrors}) => {
                    const response = await login(values)
                    if (response.data?.login.errors) {
                        setErrors(toErrorMap(response.data?.login.errors))
                    }else if (response.data?.login.user) {
                        router.push('/')
                    }
                }}>
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name='usernameOrEmail'
                            placeholder='username or email'
                            label='Username or Email'
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
                            Login
                        </Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    )
}

export default withUrqlClient(createUrqlClient)(Login)
