import React, {useState, useEffect} from 'react';
import MDEditor from '@uiw/react-md-editor/nohighlight';
import {Button, Flex, Form, Input, Layout, Select, DatePicker, Spin} from "antd";
import { InfoCircleOutlined, SaveOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import AdminLayout from '../../../components/adminLayout';
import { useLocation } from "@reach/router";
import { navigate, Link } from 'gatsby';

const PostEditor = ({ form, text, changeText, canEdit }) => {
    const formSize = "middle";

    return (
        <Layout style={{ backgroundColor: '#fff' }}>
            <Form
                form={form}
                name="frontmatter"
                autoComplete="off"
                layout="vertical"
            >
                <Form.Item
                    label="Slug"
                    name="slug"
                    rules={[
                        {
                        required: true,
                        message: '',
                        },
                    ]}
                    tooltip={{
                        title: <>
                            https://saramin.github.io/{"yyyy-mm-dd-{Slug}"}
                            <p>
                                게시물의 주요 키워드를 반드시 '-' 로 구분하여 작성해주세요!
                            </p>
                        </>,
                        overlayStyle: { maxWidth: '800px' },
                        icon: <InfoCircleOutlined/>
                    }}
                    style={{ width: '300px' }}
                >
                    <Input size={formSize} />
                </Form.Item>
                <Flex gap="large">
                    <Form.Item
                        label="Author"
                        name="author"
                        rules={[
                            {
                            required: true,
                            message: '',
                            },
                        ]}
                        style={{ width: '125px' }}
                        initialValue={"정다운"} 
                    >
                        <Input 
                            disabled 
                            size={formSize} 
                        />
                    </Form.Item>
                    <Form.Item
                        label="Date"
                        name="date"
                        rules={[
                            {
                            required: true,
                            message: '',
                            },
                        ]}
                        style={{ width: '150px' }}
                        initialValue={dayjs()}
                    >
                        <DatePicker 
                            disabled 
                            size={formSize} 
                        />
                    </Form.Item>
                    <Form.Item
                        label="Tags"
                        name="tags"
                        style={{ width: '675px' }}
                    >
                        <Select
                            size={formSize}
                            mode="tags"
                        />
                    </Form.Item>
                </Flex>
                <Form.Item
                    label="Title"
                    name="title"
                    rules={[
                        {
                        required: true,
                        message: '',
                        },
                    ]}
                    style={{ width: '1000px' }}
                >
                    <Input size={formSize} />
                </Form.Item>
            </Form>
            <MDEditor
                value={text}
                onChange={changeText}
                visibleDragbar={false}
                width="100%"
                height="800px"
                textareaProps={{
                    placeholder: '마크다운 텍스트를 입력하세요',
                }}
            />
        </Layout>
    );
};

const Post = ({ children }) => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const slug = queryParams.get("slug");

    const isNew = !(!!slug);
    const [form] = Form.useForm();
    const [markdownText, setMarkdownText] = React.useState();
    const [isDraft, setIsDraft] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const createMdFile = () => {
        form.validateFields().then(fields => {
            const convDate = fields.date.format("YYYY-MM-DD");
            const requestBody = {
                content: markdownText || "",
                frontmatter: {
                    title: fields.title,
                    author: fields.author,
                    tags: fields.tags,
                },
                date: convDate,
                slug: fields.slug,
            }

            setIsLoading(true);
            fetch("/api/post", {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            }).then(res => {
                window.location.href = `/admin/post?slug=/${convDate}-${fields.slug}/`;
            }).catch(err => {
                // ignored
            }).finally (() => {
                setIsLoading(false);
            })
        })
        .catch(err => {
            // ignored
        });
    }

    const loadMdFile = (params) => {
        return fetch('/__graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `
                query ($slug: String!) {
                    markdownRemark(fields: { slug: { eq: $slug } }) {
                        frontmatter {
                            title
                            author
                            tags
                        }
                        rawMarkdownBody
                        parent {
                            ... on File {
                                sourceInstanceName
                            }
                        }
                    }
                }
              `,
              variables: params,
            }),
        });
    }

    const saveMdFile = () => {
        form.validateFields().then(fields => {
            const convDate = fields.date.format("YYYY-MM-DD");
            const requestBody = {
                content: markdownText || "",
                frontmatter: {
                    title: fields.title,
                    author: fields.author,
                    tags: fields.tags,
                },
                date: convDate,
                slug: fields.slug,
            }
            
            setIsLoading(true);
            fetch("/api/post", {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            }).then(res => {
                window.location.href = `/admin/post?slug=/${convDate}-${fields.slug}/`;
            }).catch(err => {
                // ignored
            }).finally (() => {
                setIsLoading(false);
            })
        })
        .catch(err => {
            // ignored
        });
    }

    const deleteMdFile = () => {
        const splitSlug = slug.split("/");
        const originSlug = splitSlug[splitSlug.length-2];

        setIsLoading(true);
        fetch("/api/post", {
            method: 'DELETE',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({slug: originSlug})
        }).then(res => {
            navigate( `/admin`);
        }).catch(err => {
            // ignored
        }).finally(() => {
            setIsLoading(false);
        })
    }

    useEffect(() => {
        if (!isNew)   {
            const fetchData = async () => {
                const queryResponse = await loadMdFile({ slug });
                const result = await queryResponse.json();
                
                const markdownRemark = result.data.markdownRemark;
                const {rawMarkdownBody, frontmatter, parent} = markdownRemark;

                const mdFileType = parent.sourceInstanceName;
                if (mdFileType === 'draft') {
                    setIsDraft(true);
                }

                // slug => /YYYY-MM-DD-{originSlug}/
                const splitSlug = slug.split("/");
                const originSlug = splitSlug[splitSlug.length-2].substring(11);
                
                form.setFieldsValue({
                    ...frontmatter,
                    slug: originSlug
                })
                setMarkdownText(rawMarkdownBody);
            };
              
            fetchData();
        }
    }, []);

    return (
        <Spin spinning={isLoading} size="large">
            <AdminLayout>
                <Flex justify="flex-end" style={{ paddingBottom: '30px' }} gap={"large"}>
                    {
                        isNew ? 
                            <Button 
                                ghost 
                                type="primary"
                                icon={<SaveOutlined />}
                                onClick={createMdFile}
                            >Create</Button> : 
                            isDraft ? 
                                <Flex gap={"small"}>
                                    <Button 
                                        ghost 
                                        type="primary"
                                        icon={<SaveOutlined />}
                                        onClick={saveMdFile}
                                    >Save</Button> 
                                    <Button 
                                            ghost 
                                            danger
                                            icon={<SaveOutlined />}
                                            onClick={deleteMdFile}
                                        >Delete</Button>
                                    <a href={`${slug}`} target='_blank'>
                                        <Button ghost type="primary"><EyeOutlined />미리보기</Button>
                                    </a>
                                </Flex>
                                    :
                                <>
                                    <Button 
                                        ghost 
                                        type="primary"
                                        disabled
                                    >배포된 파일은 수정할수없습니다</Button>
                                    <a href={`${slug}`} target='_blank'>
                                        <Button ghost type="primary"><EyeOutlined />미리보기</Button>
                                    </a>
                                </>
                    }
                </Flex>
                <PostEditor form={form} text={markdownText} changeText={text => setMarkdownText(text)} />
            </AdminLayout>
        </Spin>
    )
}

export default Post;