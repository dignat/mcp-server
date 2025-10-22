 challenge : 
   Customers are still not receiving order status updates. To implement a CI/CD pipeline and fix the order notification system, complete the following challenge:

1. Review the existing ecommerce pipeline in AWS CodePipeline.

2. Add a manual approval stage that is invoked after Amazon S3 receives code updates. Create and attach an Amazon SNS topic to notify the Operations team for deployment approval.

3. Use the sample source code provided in the IDE workspace. The pipeline configurations are in the backend folder.

4. Prepare and upload the source.zip file to the source S3 bucket. The source.zip file should contain the src folder and the buildspec.yml file.

5. Test system functionality by adding items to the cart and placing orders. Use CloudWatch Logs to track and identify any issues.

6. Update the sendNotification_function Lambda function to integrate with the SNS topic. Verify notifications are being published correctly.

Note: Pipeline completion might take 5-8 minutes.

With these updates, the ecommerce platform should process orders, update order statuses, and notify users accordingly, while the CI/CD pipeline should allow on-demand updates to the Lambda functions.

chanllenge:
The shopping cart items are not persisting when users refresh their browser page or when they sign out and sign back in to the application. To resolve this issue, you'll need to implement several changes to make sure data persists. Use CloudWatch Logs throughout this process to help identify any failure points.

1. Test the current system by adding items to the shopping cart and refreshing the browser page.

2. Examine the manageCart_function Lambda function to confirm it's properly configured.

a. Review the function code to determine how the username is retrieved from the Amazon Cognito session attributes.

b. Confirm that the function properly interacts with the Amazon DynamoDB table to manage the cart.

3. Check if the DynamoDB table exists. If it doesn't exist, create a new table with appropriate configuration to store and manage the cart data for each user.

After completing this challenge, you should be able to maintain cart consistency across page refreshes and user sessions. (Remember that CloudWatch Logs can help identify failure points.)

challenge:
Securing your API Gateway API is vital. You need to make sure that only the authenticated users can access the API endpoints. Using CloudWatch Logs to identify failure points, complete the following challenge:

1. Set up an API Gateway authorizer by using Amazon Cognito. Specify "Authorization" as the Token source. This will handle the authentication process for your API.

2. Attach this Amazon Cognito authorizer to all the relevant API endpoints.

3. Enhance security by creating a web access control list (web ACL) in AWS WAF. Add your production API Gateway resource to this web ACL. Include two important AWS Managed Rules for AWS WAF in your configuration: Amazon IP reputation list and Anonymous IP list.

Note: WAF configuration changes might take 3-5 minutes to propagate.

4. Deploy all these security changes to the production (prod) stage of your API Gateway API.

After implementing these security measures, your API Gateway API should only process requests that meet all security criteria—the request must come from an authenticated user, be properly authorized, and pass the AWS WAF rules you've configured. You should still be able to perform normal operations—such as viewing products and adding items to the cart—but now with enhanced security.

challlege:
User emails are not being subscribed to an Amazon Simple Notification Service (Amazon SNS) topic after completing the Amazon Cognito sign-up process. Using Amazon CloudWatch Logs to identify failure points, complete the following challenge:

1. Check if an SNS topic exists. If it doesn't exist, create a new SNS topic and configure it to handle email notifications.

2. Update the Amazon Cognito user pool to automatically invoke the subscribeSNS_function Lambda function whenever a new user successfully completes the registration process.

3. Test the sign-up process by signing up a new user through the application's sign-up page. If you're currently logged in as "testuser," make sure to sign out first.

4. Review and update the subscribeSNS_function Lambda function to subscribe to the SNS topic for email notifications.

After implementing these changes, the system should automatically send a subscription confirmation email to newly registered users. To complete the process, users must confirm the subscription by clicking the link in the confirmation email.