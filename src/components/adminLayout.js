import * as React from "react"
import { Link } from "gatsby"
import { Button, Divider, Flex, Layout } from "antd";
import { FileImageOutlined, FormOutlined } from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

const AdminLayout = ({ key, children }) => {
  return (
    <Layout>
            <Header style={{ display: 'flex' }}>
                
            </Header>
            <Layout style={{ backgroundColor: '#fff' }}>
                <Sider style={{ backgroundColor: '#fff' }}>
                    <Flex vertical> 
                        <Link to="/admin">
                            <Button block type="text" style={{height: '60px', fontSize: '20px', paddingLeft: '0'}}>
                                <FormOutlined /> Posts
                            </Button>
                        </Link>
                        <Divider vertical style={{ margin: 0}}/>
                        <Link to="/admin/images">
                            <Button block type="text" style={{height: '60px', fontSize: '20px'}}>
                                <FileImageOutlined /> Images
                            </Button>
                        </Link>
                    </Flex>
                </Sider>
                <Content style={{ padding: '50px' }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
  )
}

export default AdminLayout;
