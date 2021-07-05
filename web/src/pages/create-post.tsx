import { Box, Button } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { withUrqlClient } from "next-urql";
import router from "next/router";
import React, { useEffect } from "react";
import { InputField } from "../components/InputField";
import { Layout } from "../components/Layout";
import {useCreatePostMutation} from "../generated/graphql"
import { createUrqlClient } from "../utils/createUrqlClient";
import { useIsAuth } from "../utils/useIsAuth";


const CreatePost: React.FC<{}> = ({}) => {
    const [, createPost] = useCreatePostMutation()

    useIsAuth()
    
    return (
        <Layout variant="small">
            <Formik
                initialValues={{ title: '', text: '' }}
                onSubmit={async (values,  {setErrors}) => {
                    const {error} = await createPost({input: values})
                    if (!error) {
                        router.push('/')
                    }
                }}>
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name='title'
                            placeholder='title'
                            label='Title'
                        />
                        <Box mt={4}>
                            <InputField
                                name='text'
                                placeholder='text...'
                                label='Text'
                                textarea
                            />
                        </Box>
                        <Button
                            mt={4}
                            type='submit'
                            isLoading={isSubmitting}
                            colorScheme='teal'>
                            Create post
                        </Button>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
}

export default withUrqlClient(createUrqlClient)(CreatePost)