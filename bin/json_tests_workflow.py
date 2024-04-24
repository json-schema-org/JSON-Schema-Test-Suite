from github import Github
import os
import sys
import json
import re


def print_github_action_notice(file_name, message):
    print(f"::notice file={file_name}::{message}")

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

            branch_name = pr.head.ref
            changed_file_content = repo.get_contents(file, ref=branch_name).decoded_content.decode('utf-8')

            # Parse JSON content
            try:
                json_content = json.loads(changed_file_content)
                for test in json_content:
                    if "specification" in test:
                        for specification_object in test["specification"]:
                            for spec, section in specification_object.items():
                                if spec in ["core", "validation", "hyper-schema"]: print_github_action_notice(file, urls[draft][spec] + section)
                                elif spec in ["quote"]: continue
                                elif spec in ["ecma262", "perl5"]: print_github_action_notice(file, urls[spec] + section)
                                elif re.match("^rfc\\d+$"): print_github_action_notice(file, urls["rfc"] + spec + ".txt#" + section)
                                else: print_github_action_notice(file, urls["iso"])
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON in file '{file}': {e}")

if __name__ == "__main__":
    main()
