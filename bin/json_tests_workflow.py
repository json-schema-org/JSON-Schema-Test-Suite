from github import Github
import os
import sys
import json

def commit_and_push_changes(repo, branch, commit_message):
    try:
        repo.git.add(update=True)
        repo.index.commit(commit_message)
        origin = repo.remote(name='origin')
        origin.push(refspec=branch)
        print("Changes committed and pushed successfully.")
    except Exception as e:
        print(f"Error occurred while committing and pushing changes: {str(e)}")

def main():

    # Get GITHUB_TOKEN from environment variables automatically
    g = Github(os.environ.get('GITHUB_TOKEN'))

    # Get repository and pull request number from environment variables
    repo_name = os.environ.get('GITHUB_REPOSITORY')
    
    # Extract pull request number from GITHUB_REF if it's a pull request event
    event_name = os.environ.get('GITHUB_EVENT_NAME')
    if event_name == 'pull_request':
        pull_request_number = os.environ.get('GITHUB_REF').split('/')[-2]
    else:
        print("Not a pull request event.")
        sys.exit(1)

    if not repo_name or not pull_request_number:
        print("Repository name or pull request number not found in environment variables.")
        sys.exit(1)

    # Get repository object
    repo = g.get_repo(repo_name)

    # Get the pull request object
    pr = repo.get_pull(int(pull_request_number))

    # Get the list of changed files in the pull request
    changed_files = [file.filename for file in pr.get_files()]

    print(changed_files)
    # Traverse each file in the 'tests' folder and print JSON content
    for file in changed_files:
        if file.startswith('tests/'):
            # Read the file content
            draft = file.split('/')[1]

            urls = json.loads(repo.get_contents("specification_urls.json").decoded_content.decode('utf-8'))

            changed_file_content = repo.get_contents(file).decoded_content.decode('utf-8')
            # Parse JSON content
            print("--------")
            try:
                json_content = json.loads(changed_file_content)
                for test in json_content:
                    print(test)
                    if "specification" in test:
                        for spec, section in test["specification"]:
                            print(spec, section)
                            if spec in ["core", "validation", "hyper-schema"]: 
                                print(urls[draft][spec] + section)
                            else: print(urls[spec] + section)
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON in file '{file}': {e}")

if __name__ == "__main__":
    main()
