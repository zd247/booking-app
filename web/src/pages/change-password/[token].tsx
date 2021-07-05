import { Box, Button, Link } from '@chakra-ui/react'
import { Formik, Form } from 'formik'
import {NextPage} from 'next'
import { withUrqlClient } from 'next-urql'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { InputField } from '../../components/InputField'
import { Wrapper } from '../../components/Wrapper'
import { useChangePasswordMutation } from '../../generated/graphql'
import { createUrqlClient } from '../../utils/createUrqlClient'
import { toErrorMap } from '../../utils/toErrorMap'
import NextLink from "next/link"

const ChangePassword: NextPage = () => {
    const router = useRouter();
    const [,changePassword] = useChangePasswordMutation()
    const [tokenError, setTokenError] = useState('')

    return (
        <Wrapper variant='small'>
        <hr/>
        <br/>
            <Formik
                initialValues={{ newPassword: '' }}
                onSubmit={async (values, {setErrors}) => {
                    const response = await changePassword({
                        newPassword: values.newPassword,
                        token: router.query.token === "string"? router.query.token : "",
                    })

                    if (response.data?.changePassword.errors) {
                        const errorMap = toErrorMap(response.data.changePassword.errors)
                        if ('token' in errorMap) {
                            setTokenError(errorMap.token)
                        }
                        setErrors(errorMap)
                    }else{
                        router.push ('/')
                    }
                
            }}>
            {({ isSubmitting }) => (
                <Form>
                    <Box mt={4}>
                        <InputField
                            name='newPassword'
                            placeholder='new password'
                            label='New Password'
                            type="password"
                        />
                    </Box>
                    {tokenError? (
                        <Box>
                             <Box color='red'>{tokenError}</Box>
                            <NextLink href ="/forgot-password">
                                <Link color='blue.400'>reset password again here..</Link>
                            </NextLink>    
                        </Box>
                       
                    ): null}
                    
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

export default withUrqlClient(createUrqlClient)(ChangePassword)