import React, { useEffect, useState } from 'react';
import {Button, Flex, Space, Table, Tag, Modal, Typography, notification, Spin} from "antd";
import Column from "antd/es/table/Column";
import {Link, graphql} from "gatsby"
import {EyeOutlined, PlusOutlined} from "@ant-design/icons";
import AdminLayout from '../../components/adminLayout';
import ColumnGroup from 'antd/es/table/ColumnGroup';
import { convertLegacyProps } from 'antd/es/button';

const PublishPost = ({ post, setLoading }) => {
    
    const uploadMdFileToGithub = () => {
        const splitSlug = post.slug.split("/");
        const originSlug = splitSlug[splitSlug.length-2];
        
        setLoading(true);
        fetch("/api/publish", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ slug: originSlug })
        }).then(res => {
            // ignored
        }).catch(err => {
            // ignored
        }).finally(() => {
            setLoading(false);
        })
    }

    const deployment = () => {
        Modal.confirm({
            width: '800px',
            title: 'Post deploy',
            content: <>
                <p>아래 포스트를 블로그에 배포 하시겠습니까?</p>
                <span style={{fontWeight: 'bold', fontSize: '15px' }}>
                    "{post.title}"
                </span>
            </>,
            okText: '배포하기',
            cancelText: '취소',
            onOk: uploadMdFileToGithub
        })
    }

    return (
        <>
            <Button 
                ghost
                type="primary"
                style={{ width: '120px' }}
                onClick={deployment}
            >배포하기</Button>
        </>
    )
}

const UnPublishPost = ({ post, setLoading }) => {
    
    const deleteMdFileOfGithub = () => {
        const splitSlug = post.slug.split("/");
        const originSlug = splitSlug[splitSlug.length-2];
        
        setLoading(true);
        fetch("/api/unpublish", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ slug: originSlug })
        }).then(res => {
            // ignored
        }).catch(err => {
            // ignored
        }).finally(() => {
            setLoading(false);
        })
    }

    const unPublish = () => {
        Modal.confirm({
            width: '800px',
            title: 'Post deploy',
            content: <>
                <p>아래 포스트를 배포취소 하시겠습니까?</p>
                <span style={{fontWeight: 'bold', fontSize: '15px' }}>
                    "{post.title}"
                </span>
            </>,
            okText: '배포취소하기',
            cancelText: '취소',
            onOk: deleteMdFileOfGithub
        })
    }

    return (
        <>
            <Button 
                danger 
                type="dashed" 
                style={{ width: '120px' }}
                onClick={unPublish}
            >배포취소</Button>
        </>
    )
}

const Dashboard = ({ posts, setLoading }) => {
    const [api, contextHolder] = notification.useNotification();

    return (
        <>
            {contextHolder}
            <Table dataSource={posts} size="small" pagination={false}>
            <Column 
                title="배포상태" 
                dataIndex="isDraft" 
                key="isDraft"
                align="center"
                render={(isDraft) => (
                    <Space>
                        <Tag color={isDraft ? '#1dbec0': '#68da66'} style={{ width: '80px', textAlign: 'center', color: '#000'}}>
                            {isDraft ? "Draft" : "Published"}
                            </Tag>
                    </Space>
                )}
            />
            <Column 
                title="제목" 
                dataIndex="title" 
                key="title"
                width="40%"
                render={(title, record) => (
                    <Link to={`/admin/post?slug=${record.slug}`}>
                        <Space>
                            <Typography.Title 
                                level={4}
                                style={{ padding: 0, margin: 0, cursor: "pointer" }}
                            >{title}</Typography.Title>
                        </Space>
                    </Link>
                )}
            />
            <Column
                title="태그"
                dataIndex="tags"
                key="tags"
                render={(tags) => (
                    <Flex vertical>
                        {tags?.map(tag => {
                            return <Tag>{tag}</Tag>
                        })}
                    </Flex>
                )}
            />
            <Column title="작성자" align="center" dataIndex="author" key="author" />
            <Column 
                title="작석일자" 
                align="center"
                key="date" 
                render={(_, record) => record.slug.substring(1,11)}
            />
            <Column
                title="Action"
                align="center"
                render={(_, record) => (
                    <Space size="middle">
                        { record.isDraft ? 
                            <PublishPost post={record} setLoading={setLoading} /> :
                            <UnPublishPost post={record} setLoading={setLoading} />
                        }
                        <a href={`${record.slug}`} target='_blank'>
                            <Button ghost type="primary"><EyeOutlined />미리보기</Button>
                        </a>
                    </Space>
                )}
            />
        </Table>
        </>
    );
};

const Admin = ({ data }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { allMarkdownRemark } = data;

    const posts = allMarkdownRemark.edges.map(element => {
        const { node } = element;
        const { fields, fileAbsolutePath, frontmatter, parent } = node;

        return {
            slug : fields.slug,
            fileAbsolutePath,
            title: frontmatter.title,
            author: frontmatter.author,
            tags: frontmatter.tags,
            isDraft: parent.sourceInstanceName === 'draft'
        }
    });

    return (
        <Spin spinning={isLoading} size="large">
            <AdminLayout>
                <Flex justify="flex-end" style={{ paddingBottom: '30px' }}>
                    <Link to="/admin/post">
                        <Button 
                            ghost 
                            type="primary"
                            icon={<PlusOutlined />}
                        >
                            Add Post
                        </Button>
                    </Link>
                </Flex>
                <Dashboard posts={posts} setLoading={setIsLoading}/>
            </AdminLayout>
        </Spin>
    )
}

export default Admin;

export const pageQuery = graphql`
    {
        allMarkdownRemark(
            sort: { fields: {slug: DESC} }
        ) {
            edges{
                node {
                    fileAbsolutePath
                    fields {
                        slug
                    }
                    frontmatter {
                        title
                        author
                        tags
                    }
                    parent {
                        ... on File {
                            sourceInstanceName
                        }
                    }
                }
            }
        } 
    }
`